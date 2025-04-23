import { AnyObject } from "@swisstype/essential";

export class XrplError extends Error {
    message: string;
    data?: AnyObject;

    constructor(message: string, data?: AnyObject) {
        super(message);
        this.name = "XrplError";
        this.message = message;
        this.data = data;
    }
}
