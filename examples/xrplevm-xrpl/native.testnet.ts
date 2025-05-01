import dotenv from "dotenv";
import { Bridge, XrplEvmAsset } from "@xrplevm/xchain-sdk";

dotenv.config();

async function main() {
    // Example bridge config (replace with your actual config values)
    const bridge = Bridge.fromConfig("testnet", {
        xrplevm: {
            privateKey: process.env.EVM_PRIVATE_KEY as string,
        },
    });

    // Example EVM asset (replace with real values)
    const asset: XrplEvmAsset = {
        address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        amount: "5",
        tokenId: "0xba5a21ca88ef6bba2bfff5088994f90e1077e2a1cc3dcc38bd261f00fce2824f",
        decimals: 18,
    };

    try {
        const result = await bridge.transfer(asset, "rK5SamsMnN7aobyXziTQJuQECTfg8xDUMi");
        console.log("Hash: ", result?.hash);
    } catch (err) {
        console.error("Transfer failed:", err);
    }
}

main();
