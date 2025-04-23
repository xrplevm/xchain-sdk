import { NetworkType } from "../types";

// XRPL side config
export interface XrplBridgeConfig {
    type: "xrpl";
    provider: string;
    keyOrSeed?: string;
}

// EVM side config
export interface EvmBridgeConfig {
    type: "xrpl-evm";
    provider: string;
    privateKey?: string;
}

export interface BridgeConfig {
    network: NetworkType;
    xrpl: XrplBridgeConfig;
    evm: EvmBridgeConfig;
}
