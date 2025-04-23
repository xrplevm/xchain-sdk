import { AnyObject } from "@swisstype/essential";

export class ProviderError extends Error {
    message: string;
    data?: AnyObject;

    constructor(message: string, data?: AnyObject) {
        super(message);
        this.name = "ProviderError";
        this.message = message;
        this.data = data;
    }
}
