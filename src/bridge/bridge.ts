import { ethers } from "ethers";
import { Client as XrplClient, Wallet as XrplWallet } from "xrpl";
import type { NetworkType } from "../types/network";
import { BridgeErrors } from "../errors/bridge.errors";
import { ProviderError } from "../errors/provider.error";
import { XrplError } from "../errors/xrpl.error";
import { XrplErrors } from "../errors/xrpl.errors";
import type { BridgeAsset } from "../types/bridge";
import type { XrplResource, EvmResource, ChainType } from "../types/chain";
import type { BridgeConfig } from "../interfaces";

export class Bridge {
    private network: NetworkType;
    private xrpl: XrplResource;
    private evm: EvmResource;

    private constructor(network: NetworkType, xrpl: XrplResource, evm: EvmResource) {
        this.network = network;
        this.xrpl = xrpl;
        this.evm = evm;
    }

    /**
     * Factory: builds resources and returns a configured Bridge.
     */
    public static fromConfig(cfg: BridgeConfig): Bridge {
        let xrpl: XrplResource;
        let evm: EvmResource;

        xrpl = Bridge.constructXrplResources(cfg.xrpl.provider, cfg.xrpl.keyOrSeed);
        evm = Bridge.constructEvmResources(cfg.evm.provider, cfg.evm.privateKey);

        return new Bridge(cfg.network, xrpl, evm);
    }

    private static constructEvmResources(rpcUrl: string, evmKey?: string, _isSource = true): EvmResource {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        let signer: ethers.Wallet | undefined;
        if (evmKey) {
            signer = new ethers.Wallet(evmKey, provider);
        }
        return { type: "xrpl-evm", provider, signer };
    }

    private static constructXrplResources(rpcUrl: string, xrplSeed?: string, _isSource = true): XrplResource {
        if (!rpcUrl) {
            throw new ProviderError(BridgeErrors.NO_RPC_FOR_XRPL_SOURCE);
        }
        const client = new XrplClient(rpcUrl);
        let wallet: XrplWallet | undefined;
        if (xrplSeed) {
            try {
                wallet = XrplWallet.fromSeed(xrplSeed);
            } catch (err: any) {
                throw new XrplError(XrplErrors.INVALID_SEED, { original: err });
            }
        }
        return { type: "xrp", client, wallet };
    }

    /**
     * Transfer assets between XRPL and XRPL-EVM.
     */
    public async transfer(from: ChainType, to: ChainType, asset: BridgeAsset, amount: number): Promise<void> {
        // Example logic, you should implement the actual transfer logic here
        if (from === "xrpl" && to === "xrpl-evm") {
            // XRPL to XRPL-EVM transfer
            // Use this.source (XrplResource) and this.destination (EvmResource)
            // Handle asset type (XRP or issued asset)
        } else if (from === "xrpl-evm" && to === "xrpl") {
            // XRPL-EVM to XRPL transfer
            // Use this.source (EvmResource) and this.destination (XrplResource)
            // Handle asset type (EVM token or XRP)
        } else {
            throw new ProviderError(BridgeErrors.UNSUPPORTED_BRIDGE_DIRECTION);
        }
    }
}
