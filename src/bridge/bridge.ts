import { Contract, ethers } from "ethers";
import { Client as XrplClient, Wallet as XrplWallet } from "xrpl";
import type { NetworkType } from "../types/network";
import { BridgeErrors } from "../errors/bridge.errors";
import { ProviderError } from "../errors/provider.error";
import { XrplError } from "../errors/xrpl.error";
import { XrplErrors } from "../errors/xrpl.errors";
import type { BridgeAsset } from "../types/bridge";
import type { XrplResource, EvmResource, ChainType } from "../types/chain";
import type { BridgeConfig } from "../interfaces";
import { interchainTokenServiceAbi } from "./contracts";
import { EvmAsset, XrpAsset, XrplIssuedAsset } from "../interfaces/assets";
import { EvmError, EvmErrors } from "../errors";

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
     * Constructs a Bridge instance from a BridgeConfig.
     * @param cfg The bridge configuration.
     * @returns A configured Bridge instance.
     */
    static fromConfig(cfg: BridgeConfig): Bridge {
        let xrpl: XrplResource;
        let evm: EvmResource;

        xrpl = Bridge.constructXrplResources(cfg.xrpl.provider, cfg.xrpl.keyOrSeed);
        evm = Bridge.constructEvmResources(cfg.evm.provider, cfg.evm.privateKey);

        return new Bridge(cfg.network, xrpl, evm);
    }

    /**
     * Construct EVM resources from RPC URL and optional private key.
     * @param rpcUrl The EVM RPC URL.
     * @param evmKey The EVM private key (optional).
     * @returns The constructed EvmResource.
     */
    private static constructEvmResources(rpcUrl: string, evmKey?: string): EvmResource {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        let signer: ethers.Wallet | undefined;
        if (evmKey) {
            signer = new ethers.Wallet(evmKey, provider);
        }
        return { type: "xrpl-evm", provider, signer };
    }

    /**
     * Construct XRPL resources from RPC URL and optional seed.
     * @param rpcUrl The XRPL RPC URL.
     * @param xrplSeed The XRPL seed (optional).
     * @returns The constructed XrplResource.
     */
    private static constructXrplResources(rpcUrl: string, xrplSeed?: string): XrplResource {
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

    private erc20DecimalCache = new Map<string, number>();

    private async getErc20Decimals(asset: EvmAsset): Promise<number> {
        // 1) Check the cache first
        const cached = this.erc20DecimalCache.get(asset.address);
        if (cached != null) {
            return cached;
        }

        // 2) If not cached, do the on-chain call
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

        // 3) Store the result in the cache
        this.erc20DecimalCache.set(asset.address, decimals);

        // 4) Return it
        return decimals;
    }

    async transfer(
        from: ChainType,
        to: ChainType,
        asset: BridgeAsset,
        amount: number,
        doorAddress?: string,
        destinationChainId?: string,
        destinationAddress?: string,
    ) {
        if (from === "xrpl-evm" && to === "xrpl") {
            return this.transferEvmToXrpl(asset as EvmAsset, amount, doorAddress!, destinationChainId!, destinationAddress!);
        } else if (from === "xrpl" && to === "xrpl-evm") {
            return this.transferXrplToEvm(asset, amount, doorAddress!);
        }
        throw new ProviderError(BridgeErrors.UNSUPPORTED_BRIDGE_DIRECTION);
    }

    private async transferEvmToXrpl(asset: EvmAsset, amount: number, door: string, dstChain: string, dstAddr: string) {
        const decimals = asset.decimals ?? (await this.getErc20Decimals(asset));
        const scaledAmount = ethers.parseUnits(amount.toString(), decimals);
        // 3) Call your interchain-transfer contract…
        const contract = this.getInterchainTokenServiceContract(door);
        const tx = await contract.interchainTransfer(
            asset.tokenId, // your on-chain token identifier
            dstChain,
            dstAddr,
            scaledAmount.toString(),
            "0x",
            "0",
        );
        const receipt = await tx.wait();
        if (!receipt) {
            throw new EvmError(EvmErrors.TX_NOT_MINED);
        }
        if (receipt.status === 0) {
            throw new EvmError(EvmErrors.TX_REVERTED, { receipt });
        }
        return receipt.transactionHash;
    }

    private async transferXrplToEvm(asset: XrpAsset | XrplIssuedAsset, amount: number, door: string) {
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
