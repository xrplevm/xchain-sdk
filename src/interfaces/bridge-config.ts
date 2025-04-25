import { NetworkType } from "../types/network";

export interface ChainConfig {
    providerUrl: string;
    chainId: string;
    axelarGatewayAddress: string;
    interchainTokenServiceAddress: string;
}

export interface BridgeConfig {
    network: NetworkType;
    xrpl: ChainConfig & { keyOrSeed?: string };
    evm: ChainConfig & { privateKey?: string };
}
