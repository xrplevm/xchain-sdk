import { EvmAsset } from "../../chains/xrplevm/types";
import { XrplIssuedAsset, XrpAsset } from "../../chains/xrpl";

export type BridgeAsset = XrpAsset | XrplIssuedAsset | EvmAsset;
