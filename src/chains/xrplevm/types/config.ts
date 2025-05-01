import { AxelarChainConfig } from "../../../common/config";

export interface XrplEvmChainConfig extends AxelarChainConfig {
    privateKey?: string;
}
