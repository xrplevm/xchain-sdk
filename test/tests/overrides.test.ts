import { Bridge } from "../../src/bridge/bridge";
import { NetworkType } from "../../src/common/network/types";
import { BridgeError, BridgeErrorCodes } from "../../src/bridge/errors";
import { EvmConnectionMock } from "../mocks/evm/evm-connection.mock";
import { XrplConnectionMock } from "../mocks/xrpl/xrpl-connection.mock";
import { XRPL_TESTNET_CONFIG } from "../../src/chains/xrpl";
import { XRPLEVM_TESTNET_CONFIG } from "../../src/chains/xrplevm";

describe("Bridge.fromConfig Overrides", () => {
    describe("Connection overrides", () => {
        it("should create just a xrpl wallet", () => {
            const bridge = Bridge.fromConfig("mainnet", {
                xrpl: { seed: "sEdVwXN5PtffKz9RZHv5EQVjxbpttza" },
            });
            expect(bridge).toBeInstanceOf(Bridge);
            const bridgeAny = bridge as any;

            expect(bridgeAny.xrpl.wallet).toBeDefined();
            expect(bridgeAny.evm.signer).toBeUndefined();
        });
        it("should create just a xrplevm wallet", () => {
            const bridge = Bridge.fromConfig("mainnet", {
                xrplevm: { privateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" },
            });
            expect(bridge).toBeInstanceOf(Bridge);
            const bridgeAny = bridge as any;

            expect(bridgeAny.xrpl.wallet).toBeUndefined();
            expect(bridgeAny.evm.signer).toBeDefined();
        });
        it("should create both xrpl and xrplevm wallets", () => {
            const bridge = Bridge.fromConfig("mainnet", {
                xrpl: { seed: "sEdVwXN5PtffKz9RZHv5EQVjxbpttza" },
                xrplevm: { privateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" },
            });
            expect(bridge).toBeInstanceOf(Bridge);
            const bridgeAny = bridge as any;
            expect(bridgeAny.xrpl.wallet).toBeDefined();
            expect(bridgeAny.evm.signer).toBeDefined();
        });
    });

    describe("XrplChainConfig override", () => {
        it("should match XRPL_TESTNET_CONFIG by default", () => {
            const bridge = Bridge.fromConfig("testnet", {
                xrpl: { seed: "sEdVwXN5PtffKz9RZHv5EQVjxbpttza" },
            });
            const bridgeAny = bridge as any;
            // Compare all config except seed (which is not in XRPL_TESTNET_CONFIG)
            Object.entries(XRPL_TESTNET_CONFIG).forEach(([key, value]) => {
                expect(bridgeAny.config.xrpl[key]).toBe(value);
            });
        });

        it("should override all XRPL config parameters", () => {
            const overrides = {
                providerUrl: "wss://custom.url",
                chainId: "custom-chain",
                gatewayAddress: "rCustomGateway",
                interchainTokenServiceAddress: "rCustomInterchain",
                gasFeeAmount: "9999999",
                seed: "sEdS5Tkdfj8GxSin8oxPsJNnLXWuNzq",
            };
            const bridge = Bridge.fromConfig("testnet", {
                xrpl: overrides,
            });
            const bridgeAny = bridge as any;
            Object.entries(overrides).forEach(([key, value]) => {
                expect(bridgeAny.config.xrpl[key]).toBe(value);
            });
        });
    });

    describe("XrplEvmChainConfig override", () => {
        it("should match XRPLEVM_TESTNET_CONFIG by default", () => {
            const bridge = Bridge.fromConfig("testnet", {
                xrplevm: { privateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" },
            });
            const bridgeAny = bridge as any;
            // Compare all config except privateKey (which is not in XRPLEVM_TESTNET_CONFIG)
            Object.entries(XRPLEVM_TESTNET_CONFIG).forEach(([key, value]) => {
                expect(bridgeAny.config.xrplevm[key]).toBe(value);
            });
        });

        it("should override all XRPLEVM config parameters", () => {
            const overrides = {
                providerUrl: "https://custom-evm.url",
                chainId: "custom-evm-chain",
                gatewayAddress: "0xCustomGateway",
                interchainTokenServiceAddress: "0xCustomInterchain",
                interchainGasValue: "12345",
                gasValue: "67890",
                privateKey: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
            };
            const bridge = Bridge.fromConfig("testnet", {
                xrplevm: overrides,
            });
            const bridgeAny = bridge as any;
            Object.entries(overrides).forEach(([key, value]) => {
                expect(bridgeAny.config.xrplevm[key]).toBe(value);
            });
        });
    });
});
