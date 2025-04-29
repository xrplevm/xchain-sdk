import { EvmAsset, XrpAsset, XrplIssuedAsset } from "../interfaces/assets";

export type BridgeAsset = XrpAsset | XrplIssuedAsset | EvmAsset;

export type TransferOptions = {
    interchainGasValue?: string;
    evmGasValue?: string;
    xrplGasFeeAmount?: string;
};
