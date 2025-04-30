import { Bridge } from "@xrplevm/xchain-sdk";
import { xrpToDrops } from "xrpl";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    const bridge = Bridge.fromConfig("testnet", {
        xrpl: {
            seed: process.env.XRPL_SEED as string,
        },
    });

    const result = await bridge.callContractWithToken(xrpToDrops("10"), "0xcfa99b4de2842bc851e04b848c0243c6d9a2a4f8", "Hello Sidechain", {
        gasFeeAmount: "1700000",
    });
    console.log("Hash: ", result.result.hash);
    process.exit(0);
}

main();
