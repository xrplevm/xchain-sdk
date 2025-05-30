import { decodeAccountID } from "xrpl";

/**
 * Translates an XRPL address to an EVM-compatible address.
 * @param address The XRPL address to translate.
 * @returns The EVM-compatible address.
 */
export function translateEvmAddress(address: string): string {
    const accountId = decodeAccountID(address);
    return `0x${Buffer.from(accountId).toString("hex")}`;
}
