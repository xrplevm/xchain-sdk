import { Contract, ethers } from "ethers";
import { interchainERC20Abi, interchainTokenServiceAbi } from "./contracts";
import { BridgeErrors, ProviderError, EvmError, EvmErrors, BridgeError } from "../errors";
import type { BridgeAsset, TransferOptions, XrplEvmTransferOptions, XrplTransferOptions } from "../types/bridge";
import { EvmAsset, XrpAsset, XrplIssuedAsset } from "../interfaces/assets";
import { NetworkType } from "../types/network";
import { translateEvmAddress, translateXrpAddress } from "./translators";
import { convertCurrencyCode } from "./translators/currency-code";
import { convertStringToHex, Payment, SubmittableTransaction, TxResponse, xrpToDrops } from "xrpl";
import deepmerge from "../../test/mock/utils/deepmerge";
import { BridgeConfig, BridgeOptions, DEFAULT_CONFIG, XrplChainConfig, XrplEvmChainConfig } from "../config";
import { XrplConnection, XrplEvmConnection } from "./connections";

export class Bridge {
    private config: BridgeConfig;
    private xrpl: XrplConnection;
    private evm: XrplEvmConnection;

    private constructor(cfg: BridgeConfig, xrpl: XrplConnection, evm: XrplEvmConnection) {
        this.config = cfg;
        this.xrpl = xrpl;
        this.evm = evm;
    }

    /**
     * Constructs a Bridge instance from a BridgeConfig.
     * @param network The network type.
     * @param overrides Optional overrides for bridge options.
     * @returns A configured Bridge instance.
     */
    static fromConfig(network: NetworkType, overrides?: BridgeOptions): Bridge {
        const networkConfig = DEFAULT_CONFIG[network];

        const xrplConfig: XrplChainConfig = overrides?.xrpl ? deepmerge(networkConfig.xrpl, overrides.xrpl) : networkConfig.xrpl;
        const xrplevmConfig: XrplEvmChainConfig = overrides?.xrplevm
            ? deepmerge(networkConfig.xrplevm, overrides.xrplevm)
            : networkConfig.xrplevm;

        const config: BridgeConfig = {
            network,
            xrpl: xrplConfig,
            xrplevm: xrplevmConfig,
        };

        if (!xrplConfig.seed && !xrplevmConfig.privateKey) {
            throw new BridgeError(BridgeErrors.MISSING_WALLET_SECRET);
        }

        const xrplConnection = XrplConnection.create(xrplConfig.providerUrl, xrplConfig.seed);
        const xrplevmConnection = XrplEvmConnection.create(xrplevmConfig.providerUrl, xrplevmConfig.privateKey);

        return new Bridge(config, xrplConnection, xrplevmConnection);
    }

    /**
     * Type guard to check if the asset is an EVM asset.
     * @param a The bridge asset.
     * @returns True if EVM asset, false otherwise.
     */
    private isEvmAsset(a: BridgeAsset): a is EvmAsset {
        return (a as EvmAsset).address !== undefined;
    }

    /**
     * Autofills ERC20 asset info (decimals, tokenId) from the contract if not provided.
     * @param asset The EVM asset.
     * @returns The asset with decimals and tokenId filled in.
     */
    private async autofillErc20Info(asset: EvmAsset): Promise<EvmAsset> {
        const provider = this.evm.provider;
        if (!provider) {
            throw new ProviderError(EvmErrors.RPC_UNAVAILABLE, { asset });
        }

        const tokenContract = new ethers.Contract(asset.address, interchainERC20Abi, provider);

        let decimals = asset.decimals;
        let tokenId = asset.tokenId;

        if (decimals === undefined) {
            try {
                decimals = await tokenContract.decimals();
            } catch (err: any) {
                throw new EvmError(EvmErrors.TX_NOT_MINED, { original: err });
            }
        }

        if (tokenId === undefined) {
            try {
                tokenId = await tokenContract.interchainTokenId();
            } catch (err: any) {
                throw new EvmError(EvmErrors.TX_NOT_MINED, { original: err });
            }
        }

        return { ...asset, decimals, tokenId };
    }

    /**
     * Transfers an asset between EVM and XRPL chains.
     * @param asset The asset to transfer (EvmAsset or XrpAsset/XrplIssuedAsset).
     * @param destinationAddress The destination address on the target chain.
     * @param options Optional transfer parameters (e.g., interchainGasValue, txValue, gasFeeAmount).
     * @returns A promise resolving to an unconfirmed transaction object.
     */
    async transfer(asset: BridgeAsset, destinationAddress: string, options: TransferOptions = {}): Promise<any> {
        if (this.isEvmAsset(asset)) {
            const interchainTokenServiceAddress = this.config.xrplevm.interchainTokenServiceAddress;
            const destinationChainId = this.config.xrpl.chainId;
            return this.transferEvmToXrpl(
                asset,
                interchainTokenServiceAddress,
                destinationChainId,
                destinationAddress,
                options as XrplEvmTransferOptions,
            );
        } else {
            const interchainTokenServiceAddress = this.config.xrpl.interchainTokenServiceAddress;
            const destinationChainId = this.config.xrplevm.chainId;
            return this.transferXrplToEvm(
                asset,
                interchainTokenServiceAddress,
                destinationChainId,
                destinationAddress,
                options as XrplTransferOptions,
            );
        }
    }

    /**
     * Handles transfer from EVM to XRPL.
     * @param asset The EVM asset to transfer.
     * @param doorAddress The InterchainTokenService contract address.
     * @param dstChainId The destination XRPL chain ID.
     * @param dstAddr The destination XRPL address.
     * @param options Optional transfer parameters (interchainGasValue, txValue, etc).
     * @returns A promise resolving to an unconfirmed transaction object.
     */
    private async transferEvmToXrpl(
        asset: EvmAsset,
        doorAddress: string,
        dstChainId: string,
        dstAddr: string,
        options: XrplEvmTransferOptions = {},
    ): Promise<any> {
        const interchainGasValue = ethers.parseEther(options.interchainGasValue ?? this.config.xrplevm.interchainGasValue);
        const gasValue = ethers.parseEther(options.evmGasValue ?? this.config.xrplevm.gasValue);
        const filledAsset = await this.autofillErc20Info(asset);

        const decimals = filledAsset.decimals;
        const tokenId = filledAsset.tokenId;

        const scaledAmount = ethers.parseUnits(filledAsset.amount.toString(), decimals);
        const translatedDstAddr = translateEvmAddress(dstAddr);

        const contract = this.getInterchainTokenServiceContract(doorAddress);
        const tx = await contract.interchainTransfer(
            tokenId,
            dstChainId,
            translatedDstAddr,
            scaledAmount.toString(),
            "0x",
            interchainGasValue,
            { gasValue },
        );

        const response = await tx.wait();

        return response;
    }

    // TODO: Move this methods to a function instead.
    /**
     * Type guard to check if the asset is an issued asset.
     * @param asset The bridge asset.
     * @returns True if issued asset, false otherwise.
     */
    private isIssuedAsset(asset: XrpAsset | XrplIssuedAsset): asset is XrplIssuedAsset {
        return (asset as XrplIssuedAsset).issuer !== undefined;
    }

    /**
     * Handles transfer from XRPL to EVM.
     * @param asset The XRPL asset to transfer (native or issued).
     * @param doorAddress The XRPL door address (bridge contract).
     * @param destinationChainId The destination EVM chain ID.
     * @param destinationAddress The destination EVM address.
     * @param options Optional transfer parameters (gasFeeAmount, etc).
     * @returns A promise resolving to an unconfirmed transaction object.
     * @throws {XrplError} If the transaction fails.
     */
    async transferXrplToEvm(
        asset: XrpAsset | XrplIssuedAsset,
        doorAddress: string,
        destinationChainId: string,
        destinationAddress: string,
        options: XrplTransferOptions = {},
    ): Promise<TxResponse<SubmittableTransaction>> {
        if (!this.xrpl.wallet) {
            throw new BridgeError(BridgeErrors.MISSING_WALLET_SECRET);
        }

        const gasFeeAmount = options.gasFeeAmount ?? this.config.xrpl.gasFeeAmount;
        const amountStr = asset.amount;

        const Amount = this.isIssuedAsset(asset)
            ? {
                  currency: convertCurrencyCode(asset.symbol!),
                  value: xrpToDrops(amountStr),
                  issuer: asset.issuer!,
              }
            : xrpToDrops(amountStr);

        const memos = [
            {
                Memo: {
                    MemoType: convertStringToHex("type"),
                    MemoData: convertStringToHex("interchain_transfer"),
                },
            },
            {
                Memo: {
                    MemoType: convertStringToHex("destination_address"),
                    MemoData: translateXrpAddress(destinationAddress),
                },
            },
            {
                Memo: {
                    MemoType: convertStringToHex("destination_chain"),
                    MemoData: convertStringToHex(destinationChainId),
                },
            },
            {
                Memo: {
                    MemoType: convertStringToHex("gas_fee_amount"),
                    MemoData: convertStringToHex(gasFeeAmount),
                },
            },
        ];

        const payment: Payment = {
            TransactionType: "Payment",
            Account: this.xrpl.wallet.address,
            Amount,
            Destination: doorAddress,
            Memos: memos,
        };

        const client = this.xrpl.client;
        const wallet = this.xrpl.wallet;

        if (!client.isConnected()) {
            await client.connect();
        }

        const tx = await client.autofill(payment);
        const signed = wallet.sign(tx);
        return await client.submitAndWait(signed.tx_blob);
    }

    /**
     * Returns an ethers.Contract instance for the InterchainTokenService.
     * @param address The contract address.
     * @returns The ethers.Contract instance.
     */
    protected getInterchainTokenServiceContract(address: string): Contract {
        if (!this.evm.signer) {
            throw new ProviderError(BridgeErrors.NO_EVM_SIGNER);
        }
        return new Contract(address, interchainTokenServiceAbi, this.evm.signer);
    }

    /**
     * Calls a contract on the destination chain with a token transfer from XRPL.
     * @param asset The XRPL asset to transfer (native XRP or issued asset).
     * @param destinationContractAddress The contract address on the destination chain.
     * @param payload The payload to send to the destination contract.
     * @param options Optional transfer parameters (gasFeeAmount, etc).
     * @returns A promise that resolves to an Unconfirmed<Transaction>.
     */
    async callContractWithToken(
        asset: XrpAsset | XrplIssuedAsset,
        destinationContractAddress: string,
        payload: string,
        options: XrplTransferOptions = {},
    ): Promise<TxResponse<SubmittableTransaction>> {
        const gasFeeAmount = options.gasFeeAmount ?? this.config.xrpl.gasFeeAmount;
        const axelarGatewayAddress = this.config.xrpl.gatewayAddress;
        const destinationChainId = this.config.xrplevm.chainId;

        const memos = [
            {
                Memo: {
                    MemoType: convertStringToHex("type"),
                    MemoData: convertStringToHex("interchain_transfer"),
                },
            },
            {
                Memo: {
                    MemoType: convertStringToHex("destination_address"),
                    MemoData: translateXrpAddress(destinationContractAddress),
                },
            },
            {
                Memo: {
                    MemoType: convertStringToHex("destination_chain"),
                    MemoData: convertStringToHex(destinationChainId),
                },
            },
            {
                Memo: {
                    MemoType: convertStringToHex("gas_fee_amount"),
                    MemoData: convertStringToHex(gasFeeAmount),
                },
            },
            {
                Memo: {
                    MemoType: convertStringToHex("payload"),
                    MemoData: convertStringToHex(payload),
                },
            },
        ];

        const Amount = this.isIssuedAsset(asset)
            ? {
                  currency: convertCurrencyCode(asset.symbol!),
                  value: asset.amount,
                  issuer: asset.issuer!,
              }
            : xrpToDrops(asset.amount);

        const payment: Payment = {
            TransactionType: "Payment",
            Account: this.xrpl.wallet!.address,
            Amount,
            Destination: axelarGatewayAddress,
            Memos: memos,
        };

        const client = this.xrpl.client;
        const wallet = this.xrpl.wallet!;

        if (!client.isConnected()) {
            await client.connect();
        }

        const tx = await client.autofill(payment);
        const signed = wallet.sign(tx);
        return await client.submitAndWait(signed.tx_blob);
    }
}
