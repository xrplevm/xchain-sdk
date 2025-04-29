import { XrplConnection } from "../../src/bridge/xrpl-connection";
import { ProviderError } from "../../src/errors/provider.error";
import { XrplError } from "../../src/errors/xrpl.error";
import { XrplErrors } from "../../src/errors/xrpl.errors";
import { XrplClientMock, XrplWalletMock } from "../mocks/xrpl";

jest.mock("xrpl", () => ({
    Client: jest.fn().mockImplementation(() => new XrplClientMock()),
    Wallet: {
        fromSeed: jest.fn().mockImplementation(() => XrplWalletMock),
    },
}));

describe("XrplConnection", () => {
    const rpcUrl = "wss://xrpl.mock";
    const seed = "sMockSeed";

    it("should create a connection with client and wallet", () => {
        const conn = XrplConnection.create(rpcUrl, seed);
        expect(conn.client).toBeInstanceOf(XrplClientMock);
        expect(conn.wallet).toBe(XrplWalletMock);
    });

    it("should create a connection with client only if no seed", () => {
        const conn = XrplConnection.create(rpcUrl);
        expect(conn.client).toBeInstanceOf(XrplClientMock);
        expect(conn.wallet).toBeUndefined();
    });

    it("should throw ProviderError if no rpcUrl", () => {
        expect(() => XrplConnection.create("")).toThrow(new ProviderError(XrplErrors.NO_RPC_FOR_XRPL_SOURCE));
    });

    it("should throw XrplError if Wallet.fromSeed throws", () => {
        const error = new Error("bad seed");
        (require("xrpl").Wallet.fromSeed as jest.Mock).mockImplementationOnce(() => {
            throw error;
        });
        expect(() => XrplConnection.create(rpcUrl, "badseed")).toThrow(new XrplError(XrplErrors.INVALID_SEED, { original: error }));
    });
});
