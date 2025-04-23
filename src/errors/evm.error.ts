import { AnyObject } from "@swisstype/essential";

export class EvmError extends Error {
    message: string;
    data?: AnyObject;

    constructor(message: string, data?: AnyObject) {
        super(message);
        this.name = "EvmError";
        this.message = message;
        this.data = data;
    }
}
