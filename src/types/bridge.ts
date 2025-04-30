import { EvmAsset, XrpAsset, XrplIssuedAsset } from "../interfaces/assets";

export type BridgeAsset = XrpAsset | XrplIssuedAsset | EvmAsset;

export type XrplEvmTransferOptions = {
    interchainGasValue?: string;
    evmGasValue?: string;
};

export type XrplTransferOptions = {
    gasFeeAmount?: string;
};

export type TransferOptions = XrplEvmTransferOptions | XrplTransferOptions;
