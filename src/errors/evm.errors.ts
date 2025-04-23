export enum EvmErrors {
    TX_REVERTED = "Transaction reverted unexpectedly",
    TX_NOT_MINED = "Transaction receipt is null. The transaction might not have been mined yet.",
    RPC_UNAVAILABLE = "EVM RPC provider is unavailable",
    INVALID_SIGNATURE = "Invalid EVM transaction signature",
}
