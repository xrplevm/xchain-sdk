import { EvmProviderMock } from "./evm.provider.mock";
import { EvmWalletMock } from "./evm.wallet.mock";
import { createMock, MethodMock } from "../../utils";

// Mock for EvmConnection static create
export const EvmConnectionMock = createMock({
    create: new MethodMock("mockResolvedValue", {
        provider: new EvmProviderMock(),
        signer: new EvmWalletMock(),
    }),
});
