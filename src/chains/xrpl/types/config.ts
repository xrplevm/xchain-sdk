import { AxelarChainConfig } from "../../../common/config";

export interface XrplChainConfig extends AxelarChainConfig {
    gasFeeAmount: string;
    seed?: string;
}
