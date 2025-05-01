export type XrplEvmTransferOptions = {
    interchainGasValue?: string;
    evmGasValue?: string;
};

export type XrplTransferOptions = {
    payload?: string;
    gasFeeAmount?: string;
};

export type TransferOptions = XrplEvmTransferOptions | XrplTransferOptions;
