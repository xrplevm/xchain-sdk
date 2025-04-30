import { EvmAsset } from "../types";

/**
 * Type guard to check if the asset is an EVM asset.
 * @param a The asset to check.
 * @returns True if EVM asset, false otherwise.
 */
export function isEvmAsset(a: unknown): a is EvmAsset {
    return (a as EvmAsset).address !== undefined;
}
