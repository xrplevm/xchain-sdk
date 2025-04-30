import { XrplChainConfig } from "../../chains/xrpl";
import { XrplEvmChainConfig } from "../../chains/xrplevm";

export interface BridgeConfig {
    xrpl: XrplChainConfig;
    xrplevm: XrplEvmChainConfig;
}

export interface BridgeConfigOptions {
    xrpl?: Partial<XrplChainConfig>;
    xrplevm?: Partial<XrplEvmChainConfig>;
}
