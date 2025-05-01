import dotenv from "dotenv";
import { Bridge, XrplIssuedAsset } from "@xrplevm/xchain-sdk";
import { convertHexToString } from "xrpl";

dotenv.config();

async function main() {
    const bridge = Bridge.fromConfig("testnet", {
        xrpl: {
            seed: process.env.XRPL_SEED as string,
        },
    });

    try {
        const iou: XrplIssuedAsset = {
            currency: "FOO",
            issuer: "rHN7vR4P1qDPGpnLgoXemuZhrm6AchBHvj",
            value: "1"
        }

        const result = await bridge.transfer(iou, "0x9159C650e1D7E10a17c450eb3D50778aBA593D61");
        console.log("Hash: ", result.result.hash);
        process.exit(0);
    } catch (err) {
        console.error("Transfer failed:", err);
    }
}

main();
