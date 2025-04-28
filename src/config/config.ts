// src/config/networks.ts
import type { NetworkType } from "../types/network";
import type { BridgeConfig } from "../interfaces";

/**
 * Default per-network settings: RPC URLs, chain IDs, and contract addresses.
 */
export const DEFAULT_CONFIG: Record<NetworkType, BridgeConfig> = {
    devnet: {
        network: "devnet",
        xrpl: {
            providerUrl: "wss://s.devnet.rippletest.net:51233",
            chainId: "xrpl-dev",
            axelarGatewayAddress: "rNrjh1KGZk2jBR3wPfAQnoidtFFYQKbQn2",
            interchainTokenServiceAddress: "rNrjh1KGZk2jBR3wPfAQnoidtFFYQKbQn2",
        },
        evm: {
            providerUrl: "https://rpc.devnet.xrplevm.org",
            chainId: "xrpl-evm-devnet",
            axelarGatewayAddress: "0xF128c84c3326727c3e155168daAa4C0156B87AD1",
            interchainTokenServiceAddress: "0x1a7580C2ef5D485E069B7cf1DF9f6478603024d3",
        },
    },
    testnet: {
        network: "testnet",
        xrpl: {
            providerUrl: "wss://s.altnet.rippletest.net:51233",
            chainId: "xrpl",
            axelarGatewayAddress: "rNrjh1KGZk2jBR3wPfAQnoidtFFYQKbQn2",
            interchainTokenServiceAddress: "rNrjh1KGZk2jBR3wPfAQnoidtFFYQKbQn2",
        },
        evm: {
            providerUrl: "https://rpc.testnet.xrplevm.org",
            chainId: "xrpl-evm-testnet",
            axelarGatewayAddress: "0xe432150cce91c13a887f7D836923d5597adD8E31",
            interchainTokenServiceAddress: "0xB5FB4BE02232B1bBA4dC8f81dc24C26980dE9e3C",
        },
    },
    mainnet: {
        network: "mainnet",
        xrpl: {
            providerUrl: "wss://s1.ripple.com:51233",
            chainId: "100",
            axelarGatewayAddress: "<MAINNET_AXELAR_GATEWAY_PLACEHOLDER>",
            interchainTokenServiceAddress: "<MAINNET_INTERCHAIN_TOKEN_SERVICE_PLACEHOLDER>",
        },
        evm: {
            providerUrl: "https://rpc.mainnet.xrplevm.org",
            chainId: "1440001",
            axelarGatewayAddress: "<MAINNET_AXELAR_GATEWAY_PLACEHOLDER>",
            interchainTokenServiceAddress: "<MAINNET_INTERCHAIN_TOKEN_SERVICE_PLACEHOLDER>",
        },
    },
};
