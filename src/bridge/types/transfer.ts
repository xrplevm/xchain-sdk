export type XrplEvmTransferOptions = {
    interchainGasValue?: string;
    gasValue?: string;
    gasLimit?: string;
};

export type XrplTransferOptions = {
    payload?: string;
    gasFeeAmount?: string;
};

export type TransferOptions = XrplEvmTransferOptions | XrplTransferOptions;
