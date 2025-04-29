import { createMock, MethodMock, mockify } from "../../mock";

// Mock for XrplWallet instance
export const XrplWalletMock = mockify({
    publicKey: "mockPublicKey",
    privateKey: "mockPrivateKey",
    classicAddress: "rMockClassicAddress",
    seed: "mockSeed",
});

// Mock for XrplWallet constructor/static
export const XrplWalletConstructorMock = createMock({
    fromSeed: new MethodMock("mockImplementation", (seed: string) => ({
        ...XrplWalletMock,
        seed,
    })),
});
