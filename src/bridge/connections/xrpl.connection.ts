import { Client as XrplClient, Wallet as XrplWallet } from "xrpl";
import { ProviderError } from "../../errors/provider.error";
import { XrplError, XrplErrors } from "../../errors";

export class XrplConnection {
    client: XrplClient;
    wallet: XrplWallet | undefined;

    private constructor(client: XrplClient, wallet?: XrplWallet) {
        this.client = client;
        this.wallet = wallet;
    }

    /**
     * Creates an XRPL connection.
     * @param rpcUrl The XRPL RPC URL.
     * @param xrplSeed The XRPL seed.
     * @returns An XrplConnection instance.
     */
    static create(rpcUrl: string, xrplSeed?: string): XrplConnection {
        if (!rpcUrl) {
            throw new ProviderError(XrplErrors.NO_RPC_FOR_XRPL_SOURCE);
        }
        const client = new XrplClient(rpcUrl);
        let wallet: XrplWallet | undefined;
        if (xrplSeed) {
            try {
                wallet = XrplWallet.fromSeed(xrplSeed);
            } catch (err: any) {
                throw new XrplError(XrplErrors.INVALID_SEED, { original: err });
            }
        }
        return new XrplConnection(client, wallet);
    }
}
