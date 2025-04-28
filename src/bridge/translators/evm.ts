import { decodeAccountID } from "xrpl";

export class EvmTranslator {
    /**
     * @inheritdoc
     */
    translateAddress(address: string): string {
        const accountId = decodeAccountID(address);
        return `0x${Buffer.from(accountId).toString("hex")}`;
    }
}
