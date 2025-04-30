// src/config/networks.ts
import type { NetworkType } from "../types/network";
import { BridgeConfig } from "./types";

/**
 * Default per-network settings: RPC URLs, chain IDs, and contract addresses.
 */
export const DEFAULT_CONFIG: Record<NetworkType, BridgeConfig> = {
    devnet: {
        network: "devnet",
        xrpl: {
            providerUrl: "wss://s.devnet.rippletest.net:51233",
            chainId: "xrpl-dev",
            gatewayAddress: "rGAbJZEzU6WaYv5y1LfyN7LBBcQJ3TxsKC",
            interchainTokenServiceAddress: "rGAbJZEzU6WaYv5y1LfyN7LBBcQJ3TxsKC",
            gasFeeAmount: "1700000",
        },
        xrplevm: {
            providerUrl: "https://rpc.devnet.xrplevm.org",
            chainId: "xrpl-evm-devnet",
            gatewayAddress: "0xF128c84c3326727c3e155168daAa4C0156B87AD1",
            interchainTokenServiceAddress: "0x1a7580C2ef5D485E069B7cf1DF9f6478603024d3",
            interchainGasValue: "0",
            gasValue: "0",
        },
    },
    testnet: {
        network: "testnet",
        xrpl: {
            providerUrl: "wss://s.altnet.rippletest.net:51233",
            chainId: "xrpl",
            gatewayAddress: "rNrjh1KGZk2jBR3wPfAQnoidtFFYQKbQn2",
            interchainTokenServiceAddress: "rNrjh1KGZk2jBR3wPfAQnoidtFFYQKbQn2",
            gasFeeAmount: "1700000",
        },
        xrplevm: {
            providerUrl: "https://rpc.testnet.xrplevm.org",
            chainId: "xrpl-evm",
            gatewayAddress: "0xe432150cce91c13a887f7D836923d5597adD8E31",
            interchainTokenServiceAddress: "0xB5FB4BE02232B1bBA4dC8f81dc24C26980dE9e3C",
            interchainGasValue: "0",
            gasValue: "0",
        },
    },
    mainnet: {
        network: "mainnet",
        xrpl: {
            providerUrl: "wss://s1.ripple.com:51233",
            // TODO: Add mainnet gateway and interchain token service addresses
            chainId: "<AXELAR_MAINNET_CHAIN_ID> ",
            gatewayAddress: "<MAINNET_AXELAR_GATEWAY_PLACEHOLDER>",
            interchainTokenServiceAddress: "<MAINNET_INTERCHAIN_TOKEN_SERVICE_PLACEHOLDER>",
            gasFeeAmount: "1700000",
        },
        xrplevm: {
            providerUrl: "https://rpc.mainnet.xrplevm.org",
            // TODO: Add mainnet gateway and interchain token service addresses
            chainId: "<AXELAR_MAINNET_CHAIN_ID>",
            gatewayAddress: "<MAINNET_AXELAR_GATEWAY_PLACEHOLDER>",
            interchainTokenServiceAddress: "<MAINNET_INTERCHAIN_TOKEN_SERVICE_PLACEHOLDER>",
            interchainGasValue: "0",
            gasValue: "0",
        },
    },
};
