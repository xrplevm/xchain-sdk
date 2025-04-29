import { convertStringToHex } from "xrpl";

/**
 * Converts an EVM address (with or without 0x) or any string to XRPL hex format.
 */
export function translateXrpAddress(address: string): string {
    // Always use convertStringToHex for XRPL memo/address fields
    // If address starts with 0x, remove it before conversion
    const clean = address.startsWith("0x") ? address.slice(2) : address;
    return convertStringToHex(clean);
}
