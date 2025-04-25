import { ChainConfig } from "./bridge-config";

export interface BridgeOptions {
    xrpl?: ChainConfig & { keyOrSeed?: string };

    evm?: ChainConfig & { privateKey?: string };
}
