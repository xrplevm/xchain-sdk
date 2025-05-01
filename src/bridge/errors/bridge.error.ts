import { AnyObject } from "@swisstype/essential";
import { BridgeErrorCodes } from "./bridge.error-codes";

export class BridgeError extends Error {
    code: string;
    data?: AnyObject;

    constructor(code: BridgeErrorCodes, data?: AnyObject) {
        super(code);
        this.name = "BridgeError";
        this.code = code;
        this.data = data;
    }
}
