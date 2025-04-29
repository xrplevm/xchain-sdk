import { Contract, ethers } from "ethers";
import { DEFAULT_CONFIG } from "../config/config";
import { interchainERC20Abi, interchainTokenServiceAbi } from "./contracts";
import { EvmConnection } from "./evm-connection";
import { XrplConnection } from "./xrpl-connection";
import { BridgeErrors, ProviderError, XrplError, XrplErrors, EvmError, EvmErrors, BridgeError } from "../errors";
import type { BridgeAsset, TransferOptions } from "../types/bridge";
import type { BridgeConfig, BridgeOptions, IEvmConnection, IXrplConnection } from "../interfaces";
import { EvmAsset, XrpAsset, XrplIssuedAsset } from "../interfaces/assets";
import { NetworkType } from "../types/network";
import { translateEvmAddress, translateXrpAddress } from "./translators";
import { convertCurrencyCode } from "./translators/currency-code";
import { convertStringToHex, Payment, xrpToDrops } from "xrpl";
import { TransactionResponse } from "ethers";
import { Transaction, Unconfirmed } from "../types";
import { parseTransactionResponse } from "./parsers/evm";
import { parseSubmitTransactionResponse } from "./parsers/xrpl";

export class Bridge {
    private config: BridgeConfig;
    private xrpl: IXrplConnection;
    private evm: IEvmConnection;

    private constructor(cfg: BridgeConfig, xrpl: IXrplConnection, evm: IEvmConnection) {
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
        const base = DEFAULT_CONFIG[network];

        const merged: BridgeConfig = {
            network,
            xrpl: { ...base.xrpl!, ...overrides?.xrpl },
            evm: { ...base.evm!, ...overrides?.evm },
        };

        const hasXrplSecret = !!merged.xrpl?.keyOrSeed;
        const hasEvmSecret = !!merged.evm?.privateKey;
        if (!hasXrplSecret && !hasEvmSecret) {
            throw new BridgeError(BridgeErrors.MISSING_WALLET_SECRET);
        }

        const xrplRes = XrplConnection.create(merged.xrpl.providerUrl!, merged.xrpl.keyOrSeed);
        const evmRes = EvmConnection.create(merged.evm.providerUrl!, merged.evm.privateKey);

        return new Bridge(merged, xrplRes, evmRes);
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
    async transfer(asset: BridgeAsset, destinationAddress: string, options: TransferOptions = {}): Promise<Unconfirmed<Transaction>> {
        if (this.isEvmAsset(asset)) {
            const interchainTokenServiceAddress = this.config.evm.interchainTokenServiceAddress;
            const destinationChainId = this.config.xrpl.chainId;
            return this.transferEvmToXrpl(asset, interchainTokenServiceAddress, destinationChainId, destinationAddress, options);
        } else {
            const interchainTokenServiceAddress = this.config.xrpl.interchainTokenServiceAddress;
            const destinationChainId = this.config.evm.chainId;
            return this.transferXrplToEvm(asset, interchainTokenServiceAddress, destinationChainId, destinationAddress, options);
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
        options: TransferOptions = {},
    ): Promise<Unconfirmed<Transaction>> {
        const interchainGasValue = options.interchainGasValue ?? ethers.parseEther("0.2");
        const txValue = options.evmGasValue ?? ethers.parseEther("0.2");
        const filledAsset = await this.autofillErc20Info(asset);

        const decimals = filledAsset.decimals;
        const tokenId = filledAsset.tokenId;

        const scaledAmount = ethers.parseUnits(filledAsset.amount.toString(), decimals);
        const translatedDstAddr = translateEvmAddress(dstAddr);

        const contract = this.getInterchainTokenServiceContract(doorAddress);
        const contractTx = await contract.interchainTransfer(
            tokenId,
            dstChainId,
            translatedDstAddr,
            scaledAmount.toString(),
            "0x",
            interchainGasValue,
            { value: txValue },
        );

        return parseTransactionResponse(contractTx as ethers.TransactionResponse);
    }

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
        options: TransferOptions = {},
    ): Promise<Unconfirmed<Transaction>> {
        const gasFeeAmount = options.xrplGasFeeAmount ?? "1700000";
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
            Account: this.xrpl.wallet!.address,
            Amount,
            Destination: doorAddress,
            Memos: memos,
        };

        const client = this.xrpl.client;
        const wallet = this.xrpl.wallet!;

        if (!client.isConnected()) {
            await client.connect();
        }

        const tx = await client.autofill(payment);
        const signed = wallet.sign(tx);
        const submitTxResponse = await client.submit(signed.tx_blob);

        return parseSubmitTransactionResponse(client, submitTxResponse);
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
     * @param gasFeeAmount The gas fee amount to include in the XRPL memo (as string, default "1700000").
     * @returns A promise that resolves to an Unconfirmed<Transaction>.
     */
    async callContractWithToken(
        asset: XrpAsset | XrplIssuedAsset,
        destinationContractAddress: string,
        payload: string,
        gasFeeAmount: string = "1700000",
    ): Promise<Unconfirmed<Transaction>> {
        const axelarGatewayAddress = this.config.xrpl.axelarGatewayAddress;
        const destinationChainId = this.config.evm.chainId;

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
            Flags: 0,
            Fee: "12",
            Memos: memos,
        };

        const client = this.xrpl.client;
        const wallet = this.xrpl.wallet!;

        if (!client.isConnected()) {
            await client.connect();
        }

        const tx = await client.autofill(payment);
        const signed = wallet.sign(tx);
        const submitTxResponse = await client.submit(signed.tx_blob);

        return parseSubmitTransactionResponse(client, submitTxResponse);
    }
}
