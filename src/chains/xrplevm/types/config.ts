import { AxelarChainConfig } from "../../../common/config";

export interface XrplEvmChainConfig extends AxelarChainConfig {
    interchainGasValue: string;
    gasValue: string;
    privateKey?: string;
}
