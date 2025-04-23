import { AnyObject } from "@swisstype/essential";

export class BridgeError extends Error {
    message: string;
    data?: AnyObject;

    constructor(message: string, data?: AnyObject) {
        super(message);
        this.name = "BridgeError";
        this.message = message;
        this.data = data;
    }
}
