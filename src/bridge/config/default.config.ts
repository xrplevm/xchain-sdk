import { BridgeConfig } from "./types";
import { NetworkType } from "../../common/network/types";
import { XRPL_DEVNET_CONFIG, XRPL_MAINNET_CONFIG, XRPL_TESTNET_CONFIG } from "../../chains/xrpl";
import { XRPLEVM_DEVNET_CONFIG, XRPLEVM_MAINNET_CONFIG, XRPLEVM_TESTNET_CONFIG } from "../../chains/xrplevm";

export const DEFAULT_BRIDGE_CONFIG: Record<NetworkType, BridgeConfig> = {
    devnet: {
        xrpl: XRPL_DEVNET_CONFIG,
        xrplevm: XRPLEVM_DEVNET_CONFIG,
    },
    testnet: {
        xrpl: XRPL_TESTNET_CONFIG,
        xrplevm: XRPLEVM_TESTNET_CONFIG,
    },
    mainnet: {
        xrpl: XRPL_MAINNET_CONFIG,
        xrplevm: XRPLEVM_MAINNET_CONFIG,
    },
};
