export enum XrplEvmErrorCodes {
    TX_REVERTED = "Transaction reverted unexpectedly",
    TX_NOT_MINED = "Transaction receipt is null.",
    RPC_UNAVAILABLE = "EVM RPC provider is unavailable",
    INVALID_SIGNATURE = "Invalid EVM transaction signature",
    NO_EVM_SIGNER = "No EVM signer provided",
}
