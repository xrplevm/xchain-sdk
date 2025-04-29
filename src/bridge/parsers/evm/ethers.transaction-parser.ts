import { ethers } from "ethers";
import { Confirmed, Transaction, Unconfirmed } from "../../../types";

/**
 * Parses an ethers transaction response into a transaction object, extending it with gasUsed and gasPrice.
 * @param txResponse The ethers transaction response.
 * @returns The transaction object with additional gasUsed and gasPrice properties.
 */
export function parseTransactionResponse<TxRes extends ethers.TransactionResponse, TData = {}>(
    txResponse: TxRes,
    extraConfirmedData?: (txReceipt: Awaited<ReturnType<TxRes["wait"]>>) => TData,
): Unconfirmed<Transaction & TData> {
    return {
        confirmed: false,
        hash: txResponse.hash,
        wait: async () => {
            const txReceipt = await txResponse.wait();

            return {
                hash: txReceipt!.hash,
                confirmed: true,
                ...extraConfirmedData?.(txReceipt as Awaited<ReturnType<TxRes["wait"]>>),
            } as Confirmed<Transaction & TData>;
        },
    };
}
