import { XrplConnection } from "../../src/bridge/xrpl-connection";
import { IXrplConnection } from "../../src/interfaces/xrpl-connection";
import { XrplErrors } from "../../src/errors/xrpl.errors";
import { ProviderError } from "../../src/errors/provider.error";
import { XrplError } from "../../src/errors/xrpl.error";
import { Wallet as XrplWallet, Client as XrplClient } from "xrpl";

// Use a public XRPL testnet server and a valid testnet seed
const TESTNET_RPC = "wss://s.altnet.rippletest.net:51233";
const VALID_TESTNET_SEED = "sEdVwXN5PtffKz9RZHv5EQVjxbpttza"; // Replace with a real testnet seed for actual tests

describe("XrplConnection (integration)", () => {
    it("should create a connection, connect the client, and return a valid wallet", async () => {
        const conn: IXrplConnection = XrplConnection.create(TESTNET_RPC, VALID_TESTNET_SEED);

        // Check client is an instance of XrplClient
        expect(conn.client).toBeInstanceOf(XrplClient);

        // Listen for the 'connected' event
        const connectedPromise = new Promise<void>((resolve) => {
            conn.client.once("connected", resolve);
        });

        // Connect and wait for the event
        await conn.client.connect();
        await connectedPromise;

        // Optionally, check connection state
        expect(conn.client.isConnected()).toBe(true);

        // Check wallet is an instance of XrplWallet and has the correct seed
        expect(conn.wallet).toBeInstanceOf(XrplWallet);
        expect(conn.wallet?.seed).toBe(VALID_TESTNET_SEED);

        // Clean up
        await conn.client.disconnect();
    });

    it("should create a connection with client only if no seed", () => {
        const conn: IXrplConnection = XrplConnection.create(TESTNET_RPC);
        expect(conn.client).toBeDefined();
        expect(conn.wallet).toBeUndefined();
    });

    it("should throw ProviderError if no rpcUrl", () => {
        expect(() => XrplConnection.create("")).toThrow(new ProviderError(XrplErrors.NO_RPC_FOR_XRPL_SOURCE));
    });

    it("should throw XrplError if Wallet.fromSeed throws (invalid seed)", () => {
        expect(() => XrplConnection.create(TESTNET_RPC, "invalidseed")).toThrow(XrplError);
    });
});
