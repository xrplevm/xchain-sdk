import type { Client } from "xrpl";
import type { Unconfirmed, Confirmed, Transaction } from "../../../types/transaction";
import { TxResponseResult, SubmittableTransaction, SubmitTransactionResponse } from "./transaction.types";
import { polling } from "../../../utils/polling";

export async function getTransaction<T extends SubmittableTransaction>(client: Client, hash: string): Promise<TxResponseResult<T>> {
    const txResult = (await client.request({ command: "tx", transaction: hash })) as any;
    return txResult.result;
}

export async function isTransactionValidated(client: Client, hash: string): Promise<boolean> {
    const tx = await getTransaction(client, hash);
    return !!tx.validated;
}

export async function awaitTransaction<T extends SubmittableTransaction = SubmittableTransaction>(
    client: Client,
    hash: string,
    { validationPollingInterval = 2000, maxValidationTries = 30 }: { validationPollingInterval?: number; maxValidationTries?: number } = {},
): Promise<TxResponseResult<T>> {
    await polling(
        () => isTransactionValidated(client, hash),
        (res) => !res,
        {
            delay: validationPollingInterval,
            maxIterations: maxValidationTries,
        },
    );
    const txResult = await getTransaction<T>(client, hash);
    return txResult;
}

/**
 * Minimal XRPL transaction parser: returns Unconfirmed<Transaction> from a SubmitTransactionResponse.
 */
export function parseSubmitTransactionResponse<T extends SubmittableTransaction, TData = {}>(
    client: Client,
    submitTxResponse: SubmitTransactionResponse<T>,
    extraValidatedData?: (txResponse: TxResponseResult<T>) => TData,
    pollingOptions?: { validationPollingInterval?: number; maxValidationTries?: number },
): Unconfirmed<Transaction & TData> {
    const hash = submitTxResponse.result.tx_json.hash;
    if (!hash) throw new Error("XRPL transaction response missing hash");

    return {
        confirmed: false,
        hash,
        wait: async () => {
            const txResponse = await awaitTransaction<T>(client, hash, pollingOptions);
            return {
                hash: txResponse.hash,
                confirmed: true,
                ...(extraValidatedData?.(txResponse) ?? {}),
            } as Confirmed<Transaction & TData>;
        },
    };
}
