import { Difference } from "@swisstype/essential";
import { SubmitResponse, SubmittableTransaction, TxResponse as XrplTxResponse } from "xrpl";

export type { SubmittableTransaction };

export type SubmitTransactionResponseResult<T extends SubmittableTransaction> = Omit<SubmitResponse["result"], "tx_json"> & {
    tx_json: Difference<SubmitResponse["result"]["tx_json"], SubmittableTransaction> & T;
};

export type SubmitTransactionResponse<T extends SubmittableTransaction> = Omit<SubmitResponse, "result"> & {
    result: SubmitTransactionResponseResult<T>;
};

export type TxResponseResult<T extends SubmittableTransaction> = Difference<XrplTxResponse["result"], SubmittableTransaction> & T;

export type TxResponse<T extends SubmittableTransaction> = Omit<XrplTxResponse, "result"> & {
    result: TxResponseResult<T>;
};
