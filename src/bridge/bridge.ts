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
    public static fromConfig(network: NetworkType, overrides?: BridgeOptions): Bridge {
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
    async transfer(asset: BridgeAsset, amount: number, destinationAddress: string, gasValue?: string): Promise<void> {
        if (this.isEvmAsset(asset)) {
            // EVM→XRPL
            const axelarGatewayAddress = this.config.evm.axelarGatewayAddress;
            const destinationChainId = this.config.xrpl.chainId;
            return this.transferEvmToXrpl(asset, amount, axelarGatewayAddress, destinationChainId, destinationAddress, gasValue);
        } else {
            // XRPL→EVM (covers both native XRP & IOUs)
            const axelarGatewayAddress = this.config.xrpl.axelarGatewayAddress;
            const destinationChainId = this.config.evm.chainId;
            return this.transferXrplToEvm(asset, amount, axelarGatewayAddress, destinationChainId, destinationAddress);
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
    private async transferEvmToXrpl(asset: EvmAsset, amount: number, door: string, dstChain: string, dstAddr: string, gasValue?: string) {
        const decimals = asset.decimals ?? (await this.getErc20Decimals(asset));
        const scaledAmount = ethers.parseUnits(amount.toString(), decimals);

        const contract = this.getInterchainTokenServiceContract(door);
        const tx = await contract.interchainTransfer(asset.tokenId, dstChain, dstAddr, scaledAmount.toString(), "0x", gasValue ?? "0");
        const receipt = await tx.wait();
        if (!receipt) {
            throw new EvmError(EvmErrors.TX_NOT_MINED);
        }
        if (receipt.status === 0) {
            throw new EvmError(EvmErrors.TX_REVERTED, { receipt });
        }
        return receipt.transactionHash;
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
    private async transferXrplToEvm(asset: XrpAsset | XrplIssuedAsset, amount: number, door: string, dstChain: string, dstAddr: string) {
        return;
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
