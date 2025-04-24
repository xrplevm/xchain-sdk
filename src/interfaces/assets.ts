export interface AssetBase {
    symbol?: string;

    decimals?: number;
}

export interface EvmAsset extends AssetBase {
    address: string;
    tokenId?: string;
}

export interface XrpAsset extends AssetBase {}

export interface XrplIssuedAsset extends AssetBase {
    issuer: string;
    currency: string;
}
