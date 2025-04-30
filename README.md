# @xrplevm/xchain-sdk

Cross-chain SDK to enable developers to bridge assets between XRPL and the XRPL EVM Sidechain programmatically.

## Table of Contents

-   [Installation](#installation)
-   [Features](#features)
-   [Core API](#core-api)
    -   [`Bridge.fromConfig(network, overrides)`](#bridgefromconfignetwork-overrides)
    -   [`bridge.transfer(asset, amount, options?)`](#bridgetransferasset-amount-options)
    -   [`bridge.callContractWithToken(...)`](#bridgecallcontractwithtoken)
-   [Configuration](#configuration)
    -   [Configuration Structure](#configuration-structure)
    -   [Required Secrets](#required-secrets)
    -   [Flow: How Configuration is Used](#flow-how-configuration-is-used)
-   [Errors](#errors)
    -   [Common Error Classes](#common-error-classes)
    -   [Example Error Codes](#example-error-codes)
        -   [BridgeErrorCodes](#bridgeerrorcodes)
        -   [XrplEvmErrorCodes](#xrplevmerrorcodes)
        -   [XrplErrorCodes](#xrplerrorcodes)
-   [Examples](#examples)

## Installation

```bash
npm install @xrplevm/xchain-sdk
# or
pnpm add @xrplevm/xchain-sdk
# or
yarn add @xrplevm/xchain-sdk
```

## Features

-   Bridge assets between XRPL and XRPL EVM Sidechain
-   Supports native XRP, issued assets, and EVM tokens
-   Simple configuration for multiple networks (mainnet, testnet, devnet)
-   TypeScript support

## Core API

### `Bridge.fromConfig(network, overrides)`

Create a bridge instance with network defaults and optional overrides.

-   `network`: `devnet` | `testnet` | `mainnet`
-   `overrides` (optional):
    -   `xrpl`: override XRPL RPC, gateway, Chain ID, or add a seed
    -   `xrplevm`: override XRPL-EVM RPC, gateway, Chain ID, or add a private key

It will expect you to input at least the private key or seed from the destination chain to build the wallet to sign and submit the transactions.

### `bridge.transfer(asset, amount, options?)`

Perform a cross-chain transfer. The direction (XRPL→EVM or EVM→XRPL) is inferred from the `asset` type.

**Note:**  
The `options` object differs depending on the transfer direction. The most relevant options are:

-   **XRPL → EVM:**

    -   `gasFeeAmount` (optional): Custom gas fee for the EVM transaction (default from config)
    -   _(See `XrplTransferOptions` for all options)_

-   **EVM → XRPL:**
    -   `interchainGasValue` (optional): Gas value for the interchain transfer (default from config)
    -   `evmGasValue` (optional): Gas value for the EVM transaction (default from config)
    -   _(See `XrplEvmTransferOptions` for all options)_

Refer to the generated TypeScript definitions for the full list of supported options and types for each direction:

-   [`XrplTransferOptions`](src/bridge/types/transfer.ts)
-   [`XrplEvmTransferOptions`](src/bridge/types/transfer.ts)

```ts
bridge.transfer(
  asset: BridgeAsset,         // EvmAsset or Xrp/XrplAsset
  amount: number,             // e.g. 1.5
  options: {
    destinationAddress: string;    // recipient on target chain
    doorAddress?: string;         // custom gateway contract
    gasValue?: string;            // XRPL→EVM only
  }
);
```

### `bridge.callContractWithToken(...)`

Execute a contract call on the destination chain with an asset transfer (GMP).

Refer to the generated TypeScript definitions for full signatures and return types.

## Configuration

The SDK provides sane defaults for all networks (RPC endpoints, Axelar gateway & token service addresses, chain IDs). You can override any value in fromConfig:

```ts
Bridge.fromConfig("mainnet", {
    evm: {
        providerUrl: "https://my.custom.rpc",
        privateKey: process.env.EVM_KEY,
    },
    xrpl: {
        providerUrl: "wss://custom.xrpl.rpc",
        keyOrSeed: process.env.XRPL_SEED,
    },
});
```

### Configuration Structure

At the core, the SDK uses the following configuration interfaces:

-   **AxelarChainConfig** :

    -   `providerUrl`: RPC endpoint for the EVM-compatible chain
    -   `chainId`: Chain ID of the EVM network
    -   `gatewayAddress`: Axelar Gateway contract address
    -   `interchainTokenServiceAddress`: Axelar Interchain Token Service contract address

-   **BridgeConfig** :

    -   `xrpl`: XRPL chain configuration, extends `AxelarChainConfig` with `seed`.
    -   `xrplevm`: EVM sidechain configuration extends `AxelarChainConfig` with `privateKey`

-   **BridgeConfigOptions**: Allows you to override any part of the default config for either chain.

### Required Secrets

The configuration enforces that you provide at least the secret (seed or private key) for the source chain. This is required to build the wallet and sign transactions. For XRPL, provide a `seed`; for EVM, provide a `privateKey`.

### Flow: How Configuration is Used

-   `Bridge.fromConfig` builds the provider for both chains using the configuration (with defaults or your overrides).
-   The wallet is built from the secret of the source chain, enabling signing and sending transactions.
-   The destination chain provider is also initialized, but the wallet is only required for the source chain.

## Errors

The SDK provides descriptive error classes and codes to help you handle issues programmatically. Most errors thrown are subclasses of `BridgeError` or chain-specific errors like `XrplEvmError`.

#### BridgeErrorCodes

-   `MISSING_WALLET_SECRET` — Wallet secret or private key not provided
-   `INVALID_CONFIG` — Configuration is invalid or incomplete

#### XrplEvmErrorCodes

-   `NO_EVM_SIGNER` — EVM signer is missing
-   `RPC_UNAVAILABLE` — EVM RPC provider is unavailable
-   `TX_NOT_MINED` — EVM transaction was not mined

#### XrplErrorCodes

-   `INVALID_SEED` — Invalid XRPL wallet seed provided
-   `NO_RPC_FOR_XRPL_SOURCE` — No RPC URL provided for XRPL source

You can catch and inspect these errors to provide better UX or debugging information:

```typescript
try {
  await bridge.transfer(...);
} catch (err) {
  if (err instanceof BridgeError) {
    console.error('Bridge error:', err.code, err.message);
  }
}
```

## Examples

See the [examples/](./examples/) directory for sample scripts:

-   Transfer XRP from XRPL to EVM
-   Transfer EVM tokens to XRPL
-   Call contracts with token transfers
