import { ethers } from "ethers";

export interface IEvmConnection {
    provider: ethers.JsonRpcProvider;
    signer?: ethers.Wallet;
    // Add methods as needed, e.g. connect(), disconnect(), etc.
}
