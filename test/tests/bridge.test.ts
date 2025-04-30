import { Bridge } from "../../src/bridge/bridge";
import { NetworkType } from "../../src/types/network";
import { BridgeError, BridgeErrors } from "../../src/errors";
import { DEFAULT_CONFIG } from "../../src/config/config";
import { XrpAsset } from "../../src/interfaces";

// Replace with real or testnet values for integration testing
const TESTNET_XRPL_PROVIDER = "wss://s.altnet.rippletest.net:51233";
const TESTNET_XRPL_SEED = "sEdVwXN5PtffKz9RZHv5EQVjxbpttza"; // Replace with a real testnet seed
const TESTNET_EVM_PROVIDER = "https://rpc.testnet.xrplevm.org";
const TESTNET_EVM_PRIVATE_KEY = "0x5b726ed6e1d4fdeec6ec7526d71c96218f6ebe4d7b10928732c49a242dd6bea9"; // Replace with a real testnet key
const TEST_ERC20_ASSET = {
    address: "0xD4949664cD82660AaE99bEdc034a0deA8A0bd517", // Use a real testnet ERC20 address if you want to test live
    tokenId: "0xbfb47d376947093b7858c1c59a4154dd291d5b2251cb56a6f7159a070f0bd518", // Example tokenId
    decimals: 18,
    symbol: "XRP",
    name: "XRP",
    amount: "10",
};

jest.setTimeout(260000); // 60 seconds for all tests in this file

describe("Bridge (integration)", () => {
    it("should construct a Bridge instance from config with valid secrets", () => {
        const overrides = {
            xrpl: {
                providerUrl: TESTNET_XRPL_PROVIDER,
                keyOrSeed: TESTNET_XRPL_SEED,
            },
            evm: {
                providerUrl: TESTNET_EVM_PROVIDER,
                privateKey: TESTNET_EVM_PRIVATE_KEY,
            },
        };

        const bridge = Bridge.fromConfig("devnet", overrides);

        expect(bridge).toBeInstanceOf(Bridge);
        // Optionally, check that connections are set up
        // @ts-expect-error: accessing private for test
        expect(bridge.xrpl.client).toBeDefined();
        // @ts-expect-error: accessing private for test
        expect(bridge.evm.provider).toBeDefined();
        // @ts-expect-error: accessing private for test
        expect(bridge.evm.signer?.privateKey).toBe(TESTNET_EVM_PRIVATE_KEY);
    });

    it("should throw if no secrets are provided", () => {
        const overrides = {
            xrpl: { providerUrl: TESTNET_XRPL_PROVIDER },
            evm: { providerUrl: TESTNET_EVM_PROVIDER },
        };
        expect(() => Bridge.fromConfig("devnet", overrides)).toThrowError(new BridgeError(BridgeErrors.MISSING_WALLET_SECRET));
    });

    it("should transfer EVM asset to XRPL", async () => {
        const overrides = {
            xrpl: {
                keyOrSeed: TESTNET_XRPL_SEED,
            },
            evm: {
                privateKey: TESTNET_EVM_PRIVATE_KEY,
            },
        };

        const bridge = Bridge.fromConfig("devnet", overrides);
        const xrplAdd = bridge["xrpl"].wallet!.address;
        console.log("XRPL Address:", xrplAdd);

        // Replace with a valid XRPL destination address
        const xrplDestination = xrplAdd;

        // This will send a real transaction!
        const txResult = await bridge.transfer(TEST_ERC20_ASSET as any, xrplDestination);

        // Log the Unconfirmed<Transaction> object
        console.log("EVM→XRPL transfer result (Unconfirmed):", txResult);

        // Wait for confirmation and log the Confirmed<Transaction>
        if (txResult && typeof txResult.wait === "function") {
            const confirmed = await txResult.wait();
            console.log("EVM→XRPL transfer result (Confirmed):", confirmed);
        }

        expect(txResult).toBeDefined();
    });

    it("should transfer native XRP from XRPL to EVM", async () => {
        const overrides = {
            xrpl: {
                keyOrSeed: TESTNET_XRPL_SEED,
            },
            evm: {
                privateKey: TESTNET_EVM_PRIVATE_KEY,
            },
        };

        const bridge = Bridge.fromConfig("testnet", overrides);

        // Native XRP asset (no issuer)
        const xrpAsset = {
            symbol: "XRP",
            amount: "10", // Amount in XRP
            // No issuer property!
        };

        const evmDestination = "0x9159C650e1D7E10a17c450eb3D50778aBA593D61"; // Replace with a valid EVM address

        const txResult = await bridge.transfer(xrpAsset as any, evmDestination);

        // Log the Unconfirmed<Transaction> object
        console.log("XRPL→EVM transfer result (Unconfirmed):", txResult);

        // Wait for confirmation and log the Confirmed<Transaction>
        if (txResult && typeof txResult.wait === "function") {
            const confirmed = await txResult.wait();
            console.log("XRPL→EVM transfer result (Confirmed):", confirmed);
        }

        expect(txResult).toBeDefined();
    });

    it("should call a contract with token transfer from XRPL", async () => {
        const overrides = {
            xrpl: {
                keyOrSeed: TESTNET_XRPL_SEED,
            },
            evm: {
                privateKey: TESTNET_EVM_PRIVATE_KEY,
            },
        };

        const bridge = Bridge.fromConfig("testnet", overrides);

        // Native XRP asset (no issuer)
        const xrpAsset: XrpAsset = {
            symbol: "XRP",
            amount: "15", // Amount in XRP
        };

        // Replace with a valid contract address on the destination chain
        const destinationContractAddress = "0xbd753c4bec615d7840698a0d2bdd3d62241afdfa";
        const payload = "Hello world!"; // Replace with actual payload if needed

        const txResult = await bridge.callContractWithToken(xrpAsset, destinationContractAddress, payload, { xrplGasFeeAmount: "1700000" });

        // Log the Unconfirmed<Transaction> object
        console.log("XRPL→EVM contract call result (Unconfirmed):", txResult);

        // Wait for confirmation and log the Confirmed<Transaction>
        if (txResult && typeof txResult.wait === "function") {
            const confirmed = await txResult.wait();
            console.log("XRPL→EVM contract call result (Confirmed):", confirmed);
        }

        expect(txResult).toBeDefined();
    });
});
