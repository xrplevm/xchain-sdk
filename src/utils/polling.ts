import { timeoutPromise, TimeoutPromiseError } from "./timeout-promise";

export type Polling<R> = Promise<R> & { abort(): void };

export interface PollingOptions {
    delay?: number;
    maxIterations?: number;
    timeout?: number;
}

/**
 * Polls a function until a condition is met.
 * @param fn The function to poll.
 * @param condition The condition to check.
 * @param options The polling options.
 * @returns The fn result when the condition is met.
 */
export function polling<R>(fn: () => Promise<R>, condition: (res: R) => boolean, options: PollingOptions = {}): Polling<R | undefined> {
    let timeout: NodeJS.Timeout;
    let abort = false;

    const polling = async (): Promise<R | undefined> => {
        const { delay = 1000, maxIterations, timeout: timeoutMs } = options;

        let i = 0;
        let promiseDidTimeout = false;
        let res: R | undefined;

        async function resolveFn(): Promise<R | undefined> {
            promiseDidTimeout = false;
            try {
                return await (timeoutMs !== undefined ? timeoutPromise(fn(), timeoutMs) : fn());
            } catch (e) {
                if (e instanceof TimeoutPromiseError) promiseDidTimeout = true;
                else throw e;
            }
        }

        res = await resolveFn();

        while (!abort && (promiseDidTimeout || condition(res!))) {
            if (i === maxIterations) throw new Error("Polling executed the maximum number iterations");
            await new Promise<void>((resolve) => {
                timeout = setTimeout(async () => {
                    i++;
                    res = await resolveFn();
                    resolve();
                }, delay);
            });
        }
        return res;
    };

    const result = polling() as Polling<R>;

    result.abort = () => {
        abort = true;
        clearTimeout(timeout);
    };

    return result;
}
