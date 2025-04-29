export class TimeoutPromiseError extends Error {
    constructor() {
        super("Promise timeout");
    }
}

/**
 * A promise that rejects after a timeout.
 * @param promise The promise to wrap.
 * @param ms The timeout in milliseconds.
 * @returns The promise result.
 */
export async function timeoutPromise<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timeout;
    const rejectedPromise = new Promise<T>((_, reject) => {
        timeout = setTimeout(() => {
            reject(new TimeoutPromiseError());
        }, ms);
    });

    const res = await Promise.race([promise, rejectedPromise]);
    clearTimeout(timeout);
    return res;
}
