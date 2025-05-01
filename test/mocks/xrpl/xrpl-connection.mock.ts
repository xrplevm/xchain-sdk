import { createMock, MethodMock } from "../../utils";
import { XrplClientMock } from "./xrpl.client.mock";
import { XrplWalletMock } from "./xrpl.wallet.mock";

// Mock for XrplConnection static create
export const XrplConnectionMock = createMock({
    create: new MethodMock("mockResolvedValue", {
        client: new XrplClientMock(),
        wallet: new XrplWalletMock(),
    }),
});
