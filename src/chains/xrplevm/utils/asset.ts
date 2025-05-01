import { XrplEvmAsset } from "../types";

/**
 * Type guard to check if the asset is an EVM asset.
 * @param a The asset to check.
 * @returns True if EVM asset, false otherwise.
 */
export function isEvmAsset(a: unknown): a is XrplEvmAsset {
    return (a as XrplEvmAsset).address !== undefined;
}
