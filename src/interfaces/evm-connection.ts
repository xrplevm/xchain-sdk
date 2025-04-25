import { ethers } from "ethers";

export interface IEvmConnection {
    provider: ethers.JsonRpcProvider;
    signer?: ethers.Wallet;
}
