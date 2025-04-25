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
     * @param cfg The bridge configuration.
     * @returns A configured Bridge instance.
     */
    public static fromConfig(network: NetworkType, overrides?: BridgeOptions): Bridge {
        // 1. Pull in the defaults for this network
        const base = DEFAULT_CONFIG[network];

        // 2. Merge in any user overrides
        const merged: BridgeConfig = {
            network,
            xrpl: { ...base.xrpl!, ...overrides?.xrpl },
            evm: { ...base.evm!, ...overrides?.evm },
        };

        // Check for at least one secret/key/seed
        const hasXrplSecret = !!merged.xrpl?.keyOrSeed;
        const hasEvmSecret = !!merged.evm?.privateKey;
        if (!hasXrplSecret && !hasEvmSecret) {
            throw new BridgeError(BridgeErrors.MISSING_WALLET_SECRET);
        }

        // 3. Wire up connections
        const xrplRes = XrplConnection.create(merged.xrpl.providerUrl!, merged.xrpl.keyOrSeed);
        const evmRes = EvmConnection.create(merged.evm.providerUrl!, merged.evm.privateKey);

        return new Bridge(merged, xrplRes, evmRes);
    }

    private isEvmAsset(a: BridgeAsset): a is EvmAsset {
        return (a as EvmAsset).address !== undefined;
    }

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

    async transfer(asset: BridgeAsset, amount: number, destinationAddress: string, gasValue?: string): Promise<void> {
        if (this.isEvmAsset(asset)) {
            // EVM→XRPL
            const axelarGatewayAddress = this.config.evm!.axelarGatewayAddress!;
            const destinationChainId = this.config.xrpl!.chainId;
            return this.transferEvmToXrpl(asset, amount, axelarGatewayAddress, destinationChainId, destinationAddress, gasValue);
        } else {
            // XRPL→EVM (covers both native XRP & IOUs)
            const axelarGatewayAddress = this.config.xrpl!.axelarGatewayAddress!;
            const destinationChainId = this.config.evm!.chainId!;
            return this.transferXrplToEvm(asset, amount, axelarGatewayAddress, destinationChainId, destinationAddress);
        }
    }

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

    private async transferXrplToEvm(asset: XrpAsset | XrplIssuedAsset, amount: number, door: string, dstChain: string, dstAddr: string) {
        return;
    }
    /**
     * Returns an ethers.Contract instance for the InterchainTokenService.
     * @param address The contract address.
     */
    protected getInterchainTokenServiceContract(address: string): Contract {
        if (!this.evm.signer) {
            throw new ProviderError(BridgeErrors.NO_EVM_SIGNER);
        }
        return new Contract(address, interchainTokenServiceAbi, this.evm.signer);
    }
}
