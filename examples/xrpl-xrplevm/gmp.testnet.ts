import { Bridge } from "@xrplevm/xchain-sdk";
import { xrpToDrops } from "xrpl";
import dotenv from "dotenv";
import { AbiCoder } from "ethers";

dotenv.config();

async function main() {
    const bridge = Bridge.fromConfig("testnet", {
        xrpl: {
            seed: process.env.XRPL_SEED as string,
        },
    });

    const encodedPayload = AbiCoder.defaultAbiCoder().encode(["string"], ["Hello Sidechain"]);
    const result = await bridge.callContract(xrpToDrops("10"), "0xcfa99b4de2842bc851e04b848c0243c6d9a2a4f8", encodedPayload.slice(2));
    console.log("Hash: ", result.result.hash);
    process.exit(0);
}

main();