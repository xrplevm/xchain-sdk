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

            // Compile-time type check
            const config: BridgeConfig = bridgeAny.config;

            Object.entries(XRPL_TESTNET_CONFIG).forEach(([key, value]) => {
                expect(bridgeAny.config.xrpl[key]).toBe(value);
                // Type check
                expect(typeof bridgeAny.config.xrpl[key]).toBe(typeof value);
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
            const bridgeAny = bridge as any;
            // Compile-time type check
            const config: BridgeConfig = bridgeAny.config;

            Object.entries(overrides).forEach(([key, value]) => {
                expect(bridgeAny.config.xrpl[key]).toBe(value);
                // Type check
                expect(typeof bridgeAny.config.xrpl[key]).toBe(typeof (overrides as any)[key]);
            });
        });
    });

    describe("XrplEvmChainConfig override", () => {
        it("should match XRPLEVM_TESTNET_CONFIG by default", () => {
            const bridge = Bridge.fromConfig("testnet", {
                xrplevm: { privateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" },
            });
            const bridgeAny = bridge as any;
            // Compile-time type check
            const config: BridgeConfig = bridgeAny.config;

            Object.entries(XRPLEVM_TESTNET_CONFIG).forEach(([key, value]) => {
                expect(bridgeAny.config.xrplevm[key]).toBe(value);
                // Type check
                expect(typeof bridgeAny.config.xrplevm[key]).toBe(typeof value);
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

            const bridgeAny = bridge as any;
            // Compile-time type check
            const config: BridgeConfig = bridgeAny.config;

            Object.entries(overrides).forEach(([key, value]) => {
                expect(bridgeAny.config.xrplevm[key]).toBe(value);
                // Type check
                expect(typeof bridgeAny.config.xrplevm[key]).toBe(typeof (overrides as any)[key]);
            });
        });
    });
});
