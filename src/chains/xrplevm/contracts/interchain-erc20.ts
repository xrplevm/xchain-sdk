export const interchainERC20Abi = [
    "function balanceOf(address account) external view returns (uint256)",
    "function interchainTokenService() view returns (address)",
    "function interchainTokenId() view returns (bytes32)",
    "function interchainTransfer(string destinationChain, bytes recipient, uint256 amount, bytes metadata) external payable",
    "function decimals() view returns (uint8)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
];
