# xchain-sdk Examples

This folder contains example usage of the `@xrplevm/xchain-sdk` package as an end user would consume it from npm.

## How to use

1. **Build the SDK** (from the root):
    ```sh
    pnpm run build:node
    ```
2. **Install dependencies in examples:**
    ```sh
    cd examples
    pnpm install
    ```
3. **Run the example:**
    ```sh
    pnpm exec ts-node index.ts
    ```

The import path `@xrplevm/xchain-sdk` will resolve to the local build output in `../dist/node`.
