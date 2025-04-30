import { ethers } from "ethers";

export class XrplEvmConnection {
    provider: ethers.JsonRpcProvider;
    signer?: ethers.Wallet;

    private constructor(provider: ethers.JsonRpcProvider, signer?: ethers.Wallet) {
        this.provider = provider;
        this.signer = signer;
    }
    /**
     * Creates an EVM connection.
     * @param rpcUrl The RPC URL.
     * @param evmKey The EVM private key.
     * @returns An XrplEvmConnection instance.
     */
    static create(rpcUrl: string, evmKey?: string): XrplEvmConnection {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        let signer: ethers.Wallet | undefined;
        if (evmKey) {
            signer = new ethers.Wallet(evmKey, provider);
        }
        return new XrplEvmConnection(provider, signer);
    }
}
