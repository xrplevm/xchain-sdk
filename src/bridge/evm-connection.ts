import { ethers } from "ethers";
import { IEvmConnection } from "../interfaces";

export class EvmConnection {
    static create(rpcUrl: string, evmKey?: string): IEvmConnection {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        let signer: ethers.Wallet | undefined;
        if (evmKey) {
            signer = new ethers.Wallet(evmKey, provider);
        }
        return { provider, signer };
    }
}
