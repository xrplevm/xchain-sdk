import { convertStringToHex } from "xrpl";

export class XrpTranslator {
    /**
     * @inheritdoc
     */
    translateAddress(address: string): string {
        return address.startsWith("0x") ? address.slice(2).toUpperCase() : convertStringToHex(address);
    }
}
