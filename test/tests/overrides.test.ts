import { Bridge } from "../../src/bridge/bridge";
import { BridgeConfig } from "../../src/bridge/config";
import { XRPL_TESTNET_CONFIG, XrplChainConfig } from "../../src/chains/xrpl";
import { XRPLEVM_TESTNET_CONFIG, XrplEvmChainConfig } from "../../src/chains/xrplevm";

describe("Bridge.fromConfig Overrides", () => {
    describe("Connection overrides", () => {
        it("should create just a xrpl wallet", () => {
            const bridge = Bridge.fromConfig("mainnet", {
                xrpl: { seed: "sEdVwXN5PtffKz9RZHv5EQVjxbpttza" },
            });
            expect(bridge).toBeInstanceOf(Bridge);

            expect(bridge.xrplConnection.wallet).toBeDefined();
            expect(bridge.xrplevmConnection.signer).toBeUndefined();
        });
        it("should create just a xrplevm wallet", () => {
            const bridge = Bridge.fromConfig("mainnet", {
                xrplevm: { privateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" },
            });
            expect(bridge).toBeInstanceOf(Bridge);

            expect(bridge.xrplConnection.wallet).toBeUndefined();
            expect(bridge.xrplevmConnection.signer).toBeDefined();
        });
        it("should create both xrpl and xrplevm wallets", () => {
            const bridge = Bridge.fromConfig("mainnet", {
                xrpl: { seed: "sEdVwXN5PtffKz9RZHv5EQVjxbpttza" },
                xrplevm: { privateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" },
            });
            expect(bridge).toBeInstanceOf(Bridge);
            expect(bridge.xrplConnection.wallet).toBeDefined();
            expect(bridge.xrplevmConnection.signer).toBeDefined();
        });
    });

    describe("XrplChainConfig override", () => {
        it("should match XRPL_TESTNET_CONFIG by default", () => {
            const bridge = Bridge.fromConfig("testnet", {
                xrpl: { seed: "sEdVwXN5PtffKz9RZHv5EQVjxbpttza" },
            });

            // Compile-time type check
            const config: BridgeConfig = bridge.config;

            Object.entries(XRPL_TESTNET_CONFIG).forEach(([key, value]) => {
                expect(bridge.config.xrpl[key]).toBe(value);
                expect(typeof bridge.config.xrpl[key]).toBe(typeof value);
            });
        });

        it("should override all XRPL config parameters and keep types", () => {
            const overrides: XrplChainConfig = {
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

            // Compile-time type check
            const config: BridgeConfig = bridge.config;

            Object.entries(overrides).forEach(([key, value]) => {
                expect(bridge.config.xrpl[key]).toBe(value);
                expect(typeof bridge.config.xrpl[key]).toBe(typeof (overrides as any)[key]);
            });
        });
    });

    describe("XrplEvmChainConfig override", () => {
        it("should match XRPLEVM_TESTNET_CONFIG by default", () => {
            const bridge = Bridge.fromConfig("testnet", {
                xrplevm: { privateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" },
            });

            // Compile-time type check
            const config: BridgeConfig = bridge.config;

            Object.entries(XRPLEVM_TESTNET_CONFIG).forEach(([key, value]) => {
                expect(bridge.config.xrplevm[key]).toBe(value);
                expect(typeof bridge.config.xrplevm[key]).toBe(typeof value);
            });
        });

        it("should override all XRPLEVM config parameters and keep types", () => {
            const overrides: XrplEvmChainConfig = {
                providerUrl: "https://custom-evm.url",
                chainId: "custom-evm-chain",
                gatewayAddress: "0xCustomGateway",
                interchainTokenServiceAddress: "0xCustomInterchain",
                interchainGasValue: "12345",
                gasValue: "67890",
                privateKey: "0x5b726ed6e1d4fdeec6ec7526d71c96218f6ebe4d7b10928732c49a242dd6bea9",
            };
            const bridge = Bridge.fromConfig("testnet", {
                xrplevm: overrides,
            });

            // Compile-time type check
            const config: BridgeConfig = bridge.config;

            Object.entries(overrides).forEach(([key, value]) => {
                expect(bridge.config.xrplevm[key]).toBe(value);
                expect(typeof bridge.config.xrplevm[key]).toBe(typeof (overrides as any)[key]);
            });
        });
    });
});
