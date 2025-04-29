import { Contract, ethers } from "ethers";
import { DEFAULT_CONFIG } from "../config/config";
import { interchainTokenServiceAbi } from "./contracts";
import { EvmConnection } from "./evm-connection";
import { XrplConnection } from "./xrpl-connection";
import { BridgeErrors, ProviderError, XrplError, XrplErrors, EvmError, EvmErrors, BridgeError } from "../errors";
import type { BridgeAsset } from "../types/bridge";
import type { BridgeConfig, BridgeOptions, IEvmConnection, IXrplConnection } from "../interfaces";
import { EvmAsset, XrpAsset, XrplIssuedAsset } from "../interfaces/assets";
import { NetworkType } from "../types/network";
import { EvmTranslator, XrpTranslator } from "./translators";
import { convertCurrencyCode } from "./translators/currency-code";
import { convertStringToHex, Payment, xrpToDrops } from "xrpl";
import { TransactionResponse } from "ethers";
import { Transaction, Unconfirmed } from "../types";

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
     * Retrieves the decimals for an ERC20 token.
     * @param asset The EVM asset.
     * @returns The number of decimals.º
     */
    private async getErc20Decimals(asset: EvmAsset): Promise<number> {
        const provider = this.evm.provider;
        if (!provider) {
            throw new ProviderError(EvmErrors.RPC_UNAVAILABLE, { asset });
        }

        const abi = ["function decimals() view returns (uint8)"];
        const tokenContract = new ethers.Contract(asset.address, abi, provider);

        let decimals: number;
        try {
            decimals = await tokenContract.decimals();
        } catch (err: any) {
            throw new EvmError(EvmErrors.TX_NOT_MINED, { original: err });
        }

        return decimals;
    }

    /**
     * Transfers assets between EVM and XRPL chains.
     * @param asset The asset to transfer.
     * @param amount The amount to transfer.
     * @param destinationAddress The destination address.
     * @param gasValue Optional gas value for EVM transfers.
     * @returns A promise that resolves when the transfer is complete.
     */
    async transfer(asset: BridgeAsset, amount: number, destinationAddress: string, gasValue?: string): Promise<any> {
        if (this.isEvmAsset(asset)) {
            // EVM→XRPL
            const interchainTokenServiceAddress = this.config.evm.interchainTokenServiceAddress;
            const destinationChainId = this.config.xrpl.chainId;
            return this.transferEvmToXrpl(asset, amount, interchainTokenServiceAddress, destinationChainId, destinationAddress, gasValue);
        } else {
            // XRPL→EVM (covers both native XRP & IOUs)
            const interchainTokenServiceAddress = this.config.xrpl.interchainTokenServiceAddress;
            const destinationChainId = this.config.evm.chainId;
            return this.transferXrplToEvm(asset, amount, interchainTokenServiceAddress, destinationChainId, destinationAddress);
        }
    }

    /**
     * Handles transfer from EVM to XRPL.
     * @param asset The EVM asset.
     * @param amount The amount to transfer.
     * @param door The contract address (door).
     * @param dstChain The destination chain ID.
     * @param dstAddr The destination address.
     * @param gasValue Optional gas value.
     * @returns The transaction hash.
     * @throws {EvmError} If transaction fails.
     */
    private async transferEvmToXrpl(
        asset: EvmAsset,
        amount: number,
        door: string,
        dstChain: string,
        dstAddr: string,
        gasValue?: string,
    ): Promise<Unconfirmed<Transaction>> {
        const decimals = asset.decimals ?? (await this.getErc20Decimals(asset));
        const scaledAmount = ethers.parseUnits(amount.toString(), decimals);
        const defaultGasValueWei = ethers.parseUnits("0.2", 18);
        const translate = new EvmTranslator();

        const translatedDstAddr = translate.translateAddress(dstAddr);
        console.log("interchainTransfer inputs:", {
            tokenId: asset.tokenId,
            dstChain,
            translatedDstAddr,
            scaledAmount: scaledAmount.toString(),
            metadata: "0x",
            gasValue: gasValue ?? defaultGasValueWei.toString(),
            overrides: { gasValue: gasValue ?? defaultGasValueWei.toString() },
        });

        console.log("got signer: ", this.evm.signer!.address);

        const contract = this.getInterchainTokenServiceContract(door);
        console.log("Connected to the contract : ", await contract.gatewayCaller());
        const tx = await contract.interchainTransfer(
            asset.tokenId,
            dstChain,
            translatedDstAddr,
            scaledAmount.toString(),
            "0x",
            gasValue ?? defaultGasValueWei,
            { value: gasValue ?? defaultGasValueWei },
        );
        const receipt = await tx.wait();
        if (!receipt) {
            throw new EvmError(EvmErrors.TX_NOT_MINED);
        }
        if (receipt.status === 0) {
            throw new EvmError(EvmErrors.TX_REVERTED, { receipt });
        }

        console.log("EVM to XRPL transfer transaction hash:", receipt);
        return receipt.transactionHash;
    }

    private isIssuedAsset(asset: XrpAsset | XrplIssuedAsset): asset is XrplIssuedAsset {
        return (asset as XrplIssuedAsset).issuer !== undefined;
    }

    /**
     * Handles transfer from XRPL to EVM.
     * @param asset The XRPL asset (native or issued).
     * @param amount The amount to transfer.
     * @param door The door address.
     * @param dstChain The destination chain ID.
     * @param dstAddr The destination address.
     * @returns A promise that resolves when the transfer is complete.
     */
    private async transferXrplToEvm(
        asset: XrpAsset | XrplIssuedAsset,
        amount: number,
        doorAddress: string,
        destinationChainId: string,
        destinationAddress: string,
    ): Promise<any> {
        try {
            // Convert amount to string for XRPL
            const amountStr = amount.toString();

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
                        MemoData: Buffer.from("interchain_transfer").toString("hex").toUpperCase(),
                        MemoType: Buffer.from("type").toString("hex").toUpperCase(),
                    },
                },
                {
                    Memo: {
                        MemoData: Buffer.from(destinationAddress.slice(2)).toString("hex").toUpperCase(),
                        MemoType: Buffer.from("destination_address").toString("hex").toUpperCase(),
                    },
                },
                {
                    Memo: {
                        MemoData: Buffer.from(destinationChainId).toString("hex").toUpperCase(),
                        MemoType: Buffer.from("destination_chain").toString("hex").toUpperCase(),
                    },
                },
                {
                    Memo: {
                        MemoData: Buffer.from("1700000").toString("hex").toUpperCase(),
                        MemoType: Buffer.from("gas_fee_amount").toString("hex").toUpperCase(),
                    },
                },
            ];

            // Build the payment transaction
            const payment: Payment = {
                TransactionType: "Payment",
                Account: this.xrpl.wallet!.address,
                Amount,
                Destination: doorAddress,
                Memos: memos,
            };

            console.log("Payment object before autofill:", JSON.stringify(payment, null, 2));

            // Use the xrpl client and wallet from your connection
            const client = this.xrpl.client;
            const wallet = this.xrpl.wallet!;

            if (!client.isConnected()) {
                await client.connect();
            }

            // Autofill transaction
            const tx = await client.autofill(payment);
            console.log("Autofilled transaction:", JSON.stringify(tx, null, 2));

            // Sign transaction
            const signed = wallet.sign(tx);

            // Submit transaction
            const result = await client.submit(signed.tx_blob);

            // Return the result (you can adjust this as needed)
            return result;
        } catch (e) {
            // Handle error as you see fit
            throw e;
        }
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
}
