import { createMock, MethodMock } from "../../mock";
import { EvmProviderMock } from "./evm.provider.mock";
import { EvmWalletMock, EvmWalletConstructorMock } from "./evm.wallet.mock";

// Mock for EvmConnection static create
export const EvmConnectionMock = createMock({
    create: new MethodMock("mockResolvedValue", {
        provider: new EvmProviderMock(),
        signer: new EvmWalletMock(),
    }),
});
