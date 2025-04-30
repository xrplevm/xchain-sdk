import { createMock, MethodMock } from "../../utils";

// Mock for ethers.JsonRpcProvider
export const EvmProviderMock = createMock({
    getNetwork: new MethodMock("mockResolvedValue", { name: "homestead", chainId: 1 }),
    getBlockNumber: new MethodMock("mockResolvedValue", 123456),
    // Add more provider methods as needed
    // Example: sendTransaction, getBalance, etc.
});
