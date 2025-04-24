export enum BridgeErrors {
    /** Configuration errors **/
    UNKNOWN_SOURCE_CHAIN = "Unknown source chain provided",
    UNKNOWN_DESTINATION_CHAIN = "Unknown destination chain provided",
    NO_RPC_FOR_EVM_SOURCE = "No RPC endpoint configured for the EVM source chain",
    NO_RPC_FOR_EVM_DESTINATION = "No RPC endpoint configured for the EVM destination chain",
    NO_RPC_FOR_XRPL_SOURCE = "No RPC/WS endpoint configured for the XRPL source chain",
    NO_RPC_FOR_XRPL_DESTINATION = "No RPC/WS endpoint configured for the XRPL destination chain",
    NO_EVM_SIGNER = "No EVM signer provided",
    NO_XRPL_SIGNER = "No XRPL signer provided",

    /** Transaction errors **/
    TRANSACTION_REVERTED = "Transaction reverted unexpectedly",
    TRANSACTION_NOT_MINED = "Transaction receipt is null. The transaction might not have been mined yet.",

    /** Bridge operation errors **/
    INVALID_CHAIN_TYPE = "Invalid chain type specified",
    UNSUPPORTED_BRIDGE_DIRECTION = "Unsupported bridge direction between the specified chains",
    UNSUPPORTED_BRIDGE_SIDE_TYPE = "Unsupported bridge side type",
}
