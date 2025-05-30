import { Contract, ethers } from "ethers";
import { convertStringToHex, Payment, SubmittableTransaction, TxResponse } from "xrpl";
import deepmerge from "../../test/utils/utils/deepmerge";
import { DEFAULT_BRIDGE_CONFIG } from "./config/default.config";
import { BridgeConfig, BridgeConfigOptions } from "./config";
import { XrplTransferOptions } from "./types/transfer";
import { XrplEvmTransferOptions } from "./types/transfer";
import { TransferOptions } from "./types/transfer";
import { BridgeAsset } from "./types";
import { NetworkType } from "../common/network/types";
import { isIssuedAsset, XrpAsset, XrplChainConfig, XrplConnection, XrplIssuedAsset } from "../chains/xrpl";
import { XrplEvmAsset, XrplEvmChainConfig, XrplEvmConnection, XrplEvmError, XrplEvmErrorCodes } from "../chains/xrplevm";
import { interchainERC20Abi } from "../chains/xrplevm/contracts/interchain-erc20";
import { interchainTokenServiceAbi } from "../chains/xrplevm/contracts/interchain-token-service";
import { isEvmAsset } from "../chains/xrplevm/utils";
import { translateEvmAddress } from "../chains/xrplevm/translators/address";
import { translateXrpAddress } from "../chains/xrpl/translators";
import { BridgeError, BridgeErrorCodes } from "./errors";

export class Bridge {
    private _config: BridgeConfig;
    private _xrplConnection: XrplConnection;
    private _xrplevmConnection: XrplEvmConnection;

    private constructor(cfg: BridgeConfig, xrpl: XrplConnection, xrplevm: XrplEvmConnection) {
        this._config = cfg;
        this._xrplConnection = xrpl;
        this._xrplevmConnection = xrplevm;
    }

    /**
     * Get the bridge configuration.
     * @returns The bridge configuration.
     */
    get config(): BridgeConfig {
        return this._config;
    }

    /**
     * Get the XRPL connection.
     * @returns The XRPL connection.
     */
    get xrplConnection(): XrplConnection {
        return this._xrplConnection;
    }

    /**
     * Get the XRPL EVM connection.
     * @returns The XRPL EVM connection.
     */
    get xrplevmConnection(): XrplEvmConnection {
        return this._xrplevmConnection;
    }

    /**
     * Constructs a Bridge instance from a BridgeConfig.
     * @param network The network type.
     * @param overrides Optional overrides for bridge options.
     * @returns A configured Bridge instance.
     */
    static fromConfig(network: NetworkType, overrides?: BridgeConfigOptions): Bridge {
        const networkConfig = DEFAULT_BRIDGE_CONFIG[network];

        const xrplConfig: XrplChainConfig = overrides?.xrpl ? deepmerge(networkConfig.xrpl, overrides.xrpl) : networkConfig.xrpl;
        const xrplevmConfig: XrplEvmChainConfig = overrides?.xrplevm
            ? deepmerge(networkConfig.xrplevm, overrides.xrplevm)
            : networkConfig.xrplevm;

        const config: BridgeConfig = {
            xrpl: xrplConfig,
            xrplevm: xrplevmConfig,
        };

        if (!xrplConfig.seed && !xrplevmConfig.privateKey) {
            throw new BridgeError(BridgeErrorCodes.MISSING_WALLET_SECRET);
        }

        const xrplConnection = XrplConnection.create(xrplConfig.providerUrl, xrplConfig.seed);
        const xrplevmConnection = XrplEvmConnection.create(xrplevmConfig.providerUrl, xrplevmConfig.privateKey);

        return new Bridge(config, xrplConnection, xrplevmConnection);
    }

    /**
     * Autofills ERC20 asset info (decimals, tokenId) from the contract if not provided.
     * @param asset The EVM asset.
     * @returns The asset with decimals and tokenId filled in.
     */
    private async autofillErc20Info(asset: XrplEvmAsset): Promise<XrplEvmAsset> {
        const provider = this.xrplevmConnection.provider;
        if (!provider) {
            throw new XrplEvmError(XrplEvmErrorCodes.RPC_UNAVAILABLE, { asset });
        }

        const tokenContract = new ethers.Contract(asset.address, interchainERC20Abi, provider);

        let decimals = asset.decimals;
        let tokenId = asset.tokenId;

        if (decimals === undefined) {
            try {
                decimals = await tokenContract.decimals();
            } catch (err: any) {
                throw new XrplEvmError(XrplEvmErrorCodes.TX_NOT_MINED, { original: err });
            }
        }

        if (tokenId === undefined) {
            try {
                tokenId = await tokenContract.interchainTokenId();
            } catch (err: any) {
                throw new XrplEvmError(XrplEvmErrorCodes.TX_NOT_MINED, { original: err });
            }
        }

        return { ...asset, decimals, tokenId };
    }

    /**
     * Transfers an XRP or Issued Asset from XRPL to EVM.
     * @param asset The XRPL asset to transfer (native XRP or issued asset).
     * @param destinationAddress The destination address on the EVM chain.
     * @param options Optional transfer parameters for XRPL transactions.
     * @returns A promise resolving to the XRPL transaction response.
     */
    async transfer(
        asset: XrpAsset | XrplIssuedAsset,
        destinationAddress: string,
        options?: XrplTransferOptions,
    ): Promise<TxResponse<SubmittableTransaction>>;
    /**
     * Transfers an EVM Asset from EVM to XRPL.
     * @param asset The EVM asset to transfer.
     * @param destinationAddress The destination address on the XRPL chain.
     * @param options Optional transfer parameters for EVM transactions.
     * @returns A promise resolving to the EVM transaction receipt, or null if not mined.
     */
    async transfer(
        asset: XrplEvmAsset,
        destinationAddress: string,
        options?: XrplEvmTransferOptions,
    ): Promise<ethers.TransactionReceipt | null>;
    /**
     * Transfers an asset between EVM and XRPL chains.
     * Implementation signature for internal use.
     * @param asset The asset to transfer (EvmAsset or XrpAsset/XrplIssuedAsset).
     * @param destinationAddress The destination address on the target chain.
     * @param options Optional transfer parameters (e.g., interchainGasValue, txValue, gasFeeAmount).
     * @returns A promise resolving to the transaction result based on the asset type.
     */
    async transfer(
        asset: BridgeAsset,
        destinationAddress: string,
        options: TransferOptions = {},
    ): Promise<TxResponse<SubmittableTransaction> | ethers.TransactionReceipt | null> {
        if (isEvmAsset(asset)) {
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
        asset: XrplEvmAsset,
        doorAddress: string,
        dstChainId: string,
        dstAddr: string,
        options: XrplEvmTransferOptions = { interchainGasValue: "0" },
    ): Promise<ethers.TransactionReceipt | null> {
        const interchainGasValue = options.interchainGasValue ? ethers.parseEther(options.interchainGasValue) : "0";
        const gasValue = options.gasValue ? ethers.parseEther(options.gasValue) : undefined;
        const gasLimit = options.gasLimit ? ethers.parseEther(options.gasLimit) : undefined;
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
            { gasValue, gasLimit },
        );

        return await tx.wait();
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
        if (!this.xrplConnection.wallet) {
            throw new BridgeError(BridgeErrorCodes.MISSING_WALLET_SECRET);
        }

        const gasFeeAmount = options.gasFeeAmount ?? this.config.xrpl.gasFeeAmount;

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
                    MemoData: convertStringToHex(isIssuedAsset(asset) ? "0" : gasFeeAmount),
                },
            },
        ];

        if (options.payload) {
            memos.push({
                Memo: {
                    MemoType: convertStringToHex("payload"),
                    MemoData: options.payload,
                },
            });
        }

        const payment: Payment = {
            TransactionType: "Payment",
            Account: this.xrplConnection.wallet.address,
            Amount: asset,
            Destination: doorAddress,
            Memos: memos,
        };

        const client = this.xrplConnection.client;
        const wallet = this.xrplConnection.wallet;

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
    private getInterchainTokenServiceContract(address: string): Contract {
        if (!this.xrplevmConnection.signer) {
            throw new XrplEvmError(XrplEvmErrorCodes.NO_EVM_SIGNER);
        }
        return new Contract(address, interchainTokenServiceAbi, this.xrplevmConnection.signer);
    }

    /**
     * Calls a contract on the destination chain with a token transfer from XRPL.
     * @param asset The XRPL asset to transfer (native XRP or issued asset).
     * @param destinationContractAddress The contract address on the destination chain.
     * @param payload The payload to send to the destination contract.
     * @returns A promise that resolves to an Unconfirmed<Transaction>.
     */
    async callContract(
        asset: XrpAsset | XrplIssuedAsset,
        destinationContractAddress: string,
        payload: string,
    ): Promise<TxResponse<SubmittableTransaction>> {
        if (!this.xrplConnection.wallet) {
            throw new BridgeError(BridgeErrorCodes.MISSING_WALLET_SECRET);
        }

        const axelarGatewayAddress = this.config.xrpl.gatewayAddress;
        const destinationChainId = this.config.xrplevm.chainId;

        const memos = [
            {
                Memo: {
                    MemoType: convertStringToHex("type"),
                    MemoData: convertStringToHex("call_contract"),
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
                    MemoType: convertStringToHex("payload"),
                    MemoData: payload,
                },
            },
        ];

        const payment: Payment = {
            TransactionType: "Payment",
            Account: this.xrplConnection.wallet.address,
            Amount: asset,
            Destination: axelarGatewayAddress,
            Memos: memos,
        };

        const client = this.xrplConnection.client;
        const wallet = this.xrplConnection.wallet;

        if (!client.isConnected()) {
            await client.connect();
        }

        const tx = await client.autofill(payment);
        const signed = wallet.sign(tx);
        return await client.submitAndWait(signed.tx_blob);
    }
}
