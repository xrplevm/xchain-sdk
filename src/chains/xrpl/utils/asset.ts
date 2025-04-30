import { XrpAsset, XrplIssuedAsset } from "../types";

/**
 * Type guard to check if the asset is an issued asset.
 * @param asset The bridge asset.
 * @returns True if issued asset, false otherwise.
 */
export function isIssuedAsset(asset: XrpAsset | XrplIssuedAsset): asset is XrplIssuedAsset {
    return (asset as XrplIssuedAsset).issuer !== undefined;
}
