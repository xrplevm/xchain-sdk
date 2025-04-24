export const interchainTokenServiceAbi = [
    "function interchainTransfer(bytes32 tokenId, string destinationChain, bytes destinationAddress, uint256 amount, bytes metadata, uint256 gasValue) external payable",

    "event InterchainTokenDeployed(bytes32 indexed tokenId, address tokenAddress, address indexed minter, string name, string symbol, uint8 decimals)",
];
