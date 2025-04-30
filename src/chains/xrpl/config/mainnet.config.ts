import { XrplChainConfig } from "../types/config";

export const XRPL_MAINNET_CONFIG: XrplChainConfig = {
    providerUrl: "wss://s1.ripple.com:51233",
    // TODO: Add mainnet gateway and interchain token service addresses
    chainId: "<AXELAR_MAINNET_CHAIN_ID> ",
    gatewayAddress: "<MAINNET_AXELAR_GATEWAY_PLACEHOLDER>",
    interchainTokenServiceAddress: "<MAINNET_INTERCHAIN_TOKEN_SERVICE_PLACEHOLDER>",
    gasFeeAmount: "1700000",
};
