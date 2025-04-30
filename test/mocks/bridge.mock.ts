import { BridgeConfig } from "../../src/bridge/config";
import { createMock, MethodMock, mockify } from "../utils";
import { EvmConnectionMock } from "./evm";
import { XrplConnectionMock } from "./xrpl";

// Mock for Bridge class
export const BridgeMock = createMock({
    fromConfig: new MethodMock("mockImplementation", () => BridgeInstanceMock),
});

export const BridgeConfigMock = mockify<BridgeConfig>({
    xrpl: {
        providerUrl: "wss://s.devnet.rippletest.net:51233",
        chainId: "100",
        gatewayAddress: "rNrjh1KGZk2jBR3wPfAQnoidtFFYQKbQn2",
        interchainTokenServiceAddress: "rNrjh1KGZk2jBR3wPfAQnoidtFFYQKbQn2",
    },
    xrplevm: {
        providerUrl: "https://rpc.xrplevm.org",
        chainId: "1440002",
        gatewayAddress: "0xF128c84c3326727c3e155168daAa4C0156B87AD1",
        interchainTokenServiceAddress: "0x1a7580C2ef5D485E069B7cf1DF9f6478603024d3",
    },
});

// Mock for Bridge instance (for use in fromConfig)
export const BridgeInstanceMock = mockify({
    transfer: new MethodMock("mockResolvedValue", undefined),
    getErc20Decimals: new MethodMock("mockResolvedValue", 18),
    transferEvmToXrpl: new MethodMock("mockResolvedValue", "0xMockTxHash"),
    transferXrplToEvm: new MethodMock("mockResolvedValue", undefined),
    getInterchainTokenServiceContract: new MethodMock("mockImplementation", () => ({})),
    isEvmAsset: new MethodMock("mockImplementation", (asset: any) => !!asset.address),
    config: BridgeConfigMock,
    xrpl: new XrplConnectionMock(),
    evm: new EvmConnectionMock(),
});
