import { XrplEvmChainConfig } from "../types/config";

export const XRPLEVM_MAINNET_CONFIG: XrplEvmChainConfig = {
    providerUrl: "https://rpc.mainnet.xrplevm.org",
    // TODO: Add mainnet gateway and interchain token service addresses
    chainId: "<AXELAR_MAINNET_CHAIN_ID>",
    gatewayAddress: "<MAINNET_AXELAR_GATEWAY_PLACEHOLDER>",
    interchainTokenServiceAddress: "<MAINNET_INTERCHAIN_TOKEN_SERVICE_PLACEHOLDER>",
};
