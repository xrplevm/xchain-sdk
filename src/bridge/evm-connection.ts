import { ethers } from "ethers";

export abstract class EvmConnection {
    public static create(rpcUrl: string, evmKey?: string) {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        let signer: ethers.Wallet | undefined;
        if (evmKey) {
            signer = new ethers.Wallet(evmKey, provider);
        }
        return { type: "xrpl-evm", provider, signer };
    }
}
