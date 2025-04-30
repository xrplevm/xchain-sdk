import { AnyObject } from "@swisstype/essential";
import { XrplErrorCodes } from "./xrpl.error-codes";

export class XrplError extends Error {
    code: XrplErrorCodes;
    data?: AnyObject;

    constructor(code: XrplErrorCodes, data?: AnyObject) {
        super(code);
        this.name = XrplError.name;
        this.code = code;
        this.data = data;
    }
}
