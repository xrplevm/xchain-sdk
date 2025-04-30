import { convertHexToString, convertStringToHex } from "xrpl";

/**
 * @see https://xrpl.org/currency-formats.html#currency-codes
 */

/**
 * Returns whether a currency code is standard or not.
 * From docs: Currency codes must be exactly 3 ASCII characters in length. The following characters are permitted: all uppercase and lowercase letters, digits, as well as the symbols ?, !, @, #, $, %, ^, &, *, <, >, (, ), {, }, [, ], and |.
 * @param currencyCode A currency code.
 * @returns Whether the currency code is standard.
 */
export function isStandardCurrencyCode(currencyCode: string): boolean {
    return /^[a-zA-Z0-9?!@#$%^&*<>()[\]{}|]{3}$/.test(currencyCode);
}

/**
 * Returns whether a currency code is non standard or not.
 * From docs: You can also use a 160-bit (40-character) hexadecimal string such as 015841551A748AD2C1F76FF6ECB0CCCD00000000 as the currency code. To prevent this from being treated as a "standard" currency code, the first 8 bits MUST NOT be 0x00.
 * @param currencyCode A currency code.
 * @returns Whether the currency code is non standard.
 */
export function isNonStandardCurrencyCode(currencyCode: string): boolean {
    return /^[a-fA-F0-9]{40}$/.test(currencyCode) && !currencyCode.startsWith("00");
}

/**
 * Converts a currency code to the accepted format by xrpl.
 * @param currencyCode Standard or non standard currency code.
 * @returns The currency code in hex format if non standard or the same currency code if standard.
 */
export function convertCurrencyCode(currencyCode: string): string {
    if (isStandardCurrencyCode(currencyCode)) return currencyCode;
    else if (isNonStandardCurrencyCode(currencyCode)) return currencyCode;
    else {
        const convertedCurrencyCode = convertStringToHex(currencyCode);
        if (convertedCurrencyCode.length > 40)
            throw new Error(
                `Converted currency code ${currencyCode} has length ${currencyCode.length}, which is over the non standard currency code 40 characters limit`,
            );
        else if (currencyCode.startsWith("00"))
            throw new Error(`Converted currency code ${currencyCode} cannot start with 00 since it is a non standard currency code`);
        return convertedCurrencyCode.padEnd(40, "0");
    }
}

/**
 * Parses an xrpl currency code.
 * @param currencyCode A standard or non standard currency code.
 * @returns A currency code.
 */
export function parseCurrencyCode(currencyCode: string): string {
    if (isStandardCurrencyCode(currencyCode)) return currencyCode;
    else if (currencyCode.length < 40)
        throw new Error(
            `Currency code ${currencyCode} is not a valid non standard currency code, since it has ${currencyCode.length} characters instead of 40`,
        );
    else if (currencyCode.startsWith("00"))
        throw new Error(`Currency code ${currencyCode} cannot start with 00 since it is a non standard currency code`);
    else
        try {
            return convertHexToString(currencyCode).replace(/\0/g, "");
        } catch (e) {
            throw new Error(`Currency code ${currencyCode} is not a valid non standard currency code: ${e}`);
        }
}
