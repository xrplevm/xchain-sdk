import { createMock, MethodMock } from "../../mock";
import { XrplClientMock } from "./xrpl.client.mock";
import { XrplWalletMock, XrplWalletConstructorMock } from "./xrpl.wallet.mock";

// Mock for XrplConnection static create
export const XrplConnectionMock = createMock({
    create: new MethodMock("mockResolvedValue", {
        client: new XrplClientMock(),
        wallet: new XrplWalletMock(),
    }),
});
