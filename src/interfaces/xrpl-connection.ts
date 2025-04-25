import { Client as XrplClient, Wallet as XrplWallet } from "xrpl";

export interface IXrplConnection {
    client: XrplClient;
    wallet?: XrplWallet;
    // Add methods as needed, e.g. connect(), disconnect(), etc.
}
