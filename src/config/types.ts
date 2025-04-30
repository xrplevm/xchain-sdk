import { NetworkType } from "../types/network";

export interface XrplChainConfig extends AxelarChainConfig {
    gasFeeAmount: string;
    seed?: string;
}

export interface XrplEvmChainConfig extends AxelarChainConfig {
    interchainGasValue: string;
    gasValue: string;
    privateKey?: string;
}

export interface AxelarChainConfig {
    providerUrl: string;
    chainId: string;
    gatewayAddress: string;
    interchainTokenServiceAddress: string;
}

export interface BridgeConfig {
    network: NetworkType;
    xrpl: XrplChainConfig;
    xrplevm: XrplEvmChainConfig;
}

export type XrplBridgeOptions = Partial<XrplChainConfig>;

export type XrplEvmBridgeOptions = Partial<XrplEvmChainConfig>;

export interface BridgeOptions {
    xrpl?: XrplBridgeOptions;
    xrplevm?: XrplEvmBridgeOptions;
}
