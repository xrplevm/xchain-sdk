import { EvmConnection } from "../../src/bridge/evm-connection";
import { IEvmConnection } from "../../src/interfaces";
import { ethers } from "ethers";

// Use a public Ethereum testnet RPC and a valid testnet private key
const TESTNET_RPC = "https://rpc.ankr.com/eth_sepolia"; // Or another public testnet RPC
const VALID_TESTNET_PRIVATE_KEY = "0x4c0883a69102937d6231471b5dbb6204fe5129617082796fe2b8b8b6e3b8e7e9"; // Example key, replace for real tests

describe("EvmConnection (integration)", () => {
    it("should create a connection with provider and signer (valid key)", () => {
        const conn: IEvmConnection = EvmConnection.create(TESTNET_RPC, VALID_TESTNET_PRIVATE_KEY);

        // Check provider is an instance of ethers.JsonRpcProvider
        expect(conn.provider).toBeInstanceOf(ethers.JsonRpcProvider);

        // Check signer is an instance of ethers.Wallet and has the correct private key
        expect(conn.signer).toBeInstanceOf(ethers.Wallet);
        expect(conn.signer?.privateKey).toBe(VALID_TESTNET_PRIVATE_KEY);
        expect(conn.signer?.provider).toBe(conn.provider);
    });

    it("should create a connection with provider only if no key", () => {
        const conn: IEvmConnection = EvmConnection.create(TESTNET_RPC);
        expect(conn.provider).toBeInstanceOf(ethers.JsonRpcProvider);
        expect(conn.signer).toBeUndefined();
    });
});
