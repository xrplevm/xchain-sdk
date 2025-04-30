export type XrplEvmTransferOptions = {
    interchainGasValue?: string;
    evmGasValue?: string;
};

export type XrplTransferOptions = {
    gasFeeAmount?: string;
};

export type TransferOptions = XrplEvmTransferOptions | XrplTransferOptions;
