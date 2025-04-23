import { ethers } from "ethers";
import { Client as XrplClient, Wallet as XrplWallet } from "xrpl";

export type ChainType = "xrpl-evm" | "xrpl";

export type EvmResource = {
    type: "xrpl-evm";
    provider: ethers.JsonRpcProvider;
    signer?: ethers.Wallet;
};
export type XrplResource = {
    type: "xrp";
    client: XrplClient;
    wallet?: XrplWallet;
};
