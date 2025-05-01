import { AnyObject } from "@swisstype/essential";
import { XrplEvmErrorCodes } from "./xrplevm.error-codes";

export class XrplEvmError extends Error {
    code: XrplEvmErrorCodes;
    data?: AnyObject;

    constructor(code: XrplEvmErrorCodes, data?: AnyObject) {
        super(code);
        this.name = XrplEvmError.name;
        this.code = code;
        this.data = data;
    }
}
