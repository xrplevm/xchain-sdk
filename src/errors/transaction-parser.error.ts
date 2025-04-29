import { AnyObject } from "@swisstype/essential";

export class TransactionParserError extends Error {
    message: string;
    data?: AnyObject;

    constructor(message: string, data?: AnyObject) {
        super(message);
        this.name = "TransactionParserError";
        this.message = message;
        this.data = data;
    }
}
