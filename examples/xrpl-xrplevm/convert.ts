import { convertStringToHex } from "xrpl";

async function main() {
    const result = convertStringToHex("0xc8895f8ceb0cae9da15bb9d2bc5859a184ca0f61c88560488355c8a7364deef8");
    console.log(result);
}

main();