import { ChainConfig } from "./bridge-config";

export type ChainOptions = Partial<ChainConfig> & { keyOrSeed?: string; privateKey?: string };

export interface BridgeOptions {
    xrpl?: ChainOptions;
    evm?: ChainOptions;
}
