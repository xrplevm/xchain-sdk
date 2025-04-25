export interface AssetBase {
    symbol?: string;

    decimals?: number;
    amount: string;
}

export interface EvmAsset extends AssetBase {
    address: string;
    tokenId?: string;
}

export interface XrpAsset extends AssetBase {
    symbol: "XRP";
    decimals?: 6;
}

export interface XrplIssuedAsset extends AssetBase {
    issuer: string;
    currency: string;
    value: string;
}
