import { createMock, MethodMock, mockify } from "../../utils";

// Mock for ethers.Wallet instance
export const EvmWalletMock = mockify({
    address: "0xMockAddress",
    publicKey: "0xMockPublicKey",
    privateKey: "0xMockPrivateKey",
    // Add more wallet properties/methods as needed
});

// Mock for ethers.Wallet constructor/static
export const EvmWalletConstructorMock = createMock({
    // Simulate new Wallet(privateKey, provider)
    new: new MethodMock("mockImplementation", (privateKey: string, provider: any) => ({
        ...EvmWalletMock,
        privateKey,
        provider,
    })),
});
