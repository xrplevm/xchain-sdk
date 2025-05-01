import dotenv from "dotenv";
import { Bridge, XrplEvmAsset } from "@xrplevm/xchain-sdk";

dotenv.config();

async function main() {
    // Example EVM asset (replace with real values)
    const asset: XrplEvmAsset = {
        address: "0xD4949664cD82660AaE99bEdc034a0deA8A0bd517",
        amount: "5",
        tokenId: "0xbfb47d376947093b7858c1c59a4154dd291d5b2251cb56a6f7159a070f0bd518",
        decimals: 18,
    };

    // Example bridge config (replace with your actual config values)
    const bridge = Bridge.fromConfig("devnet", {
        xrplevm: {
            privateKey: process.env.EVM_PRIVATE_KEY as string,
        },
    });

    // Destination XRPL address (replace with a real XRPL address)
    const destinationAddress = "rhSMkNV5MVQEgkxH5YCAAE8KAEkXpP3N5u"; // sEdVXq1iJUcnUhsNhimNLwzgjPFiC9E

    try {
        const result = await bridge.transfer(asset, destinationAddress);
        console.log("Transfer result:", result);
    } catch (err) {
        console.error("Transfer failed:", err);
    }
}

main();
