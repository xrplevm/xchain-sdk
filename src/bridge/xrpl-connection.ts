import { Client as XrplClient, Wallet as XrplWallet } from "xrpl";
import { ProviderError } from "../errors/provider.error";
import { XrplError } from "../errors/xrpl.error";
import { XrplErrors } from "../errors/xrpl.errors";

export abstract class XrplConnection {
    public static create(rpcUrl: string, xrplSeed?: string) {
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
        return { type: "xrpl", client, wallet };
    }
}
