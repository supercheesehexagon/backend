/**
 * Turns the data stream into async iterator (Symbol.[asyncIterator], for await (...)) form.
 *
 * Supports both scenarios:
 * - when data is coming in faster than it is being taken out
 * - and vice versa.
 *
 * Terminates the iterator when the stream is over.
 *
 * Terminates the iterator at any element with error, if an error is received from the stream
 *
 * *Limitations:*
 * - No restrictions on data buffering
 * - No up stream control to slow down data transfer from the sending side when buffers are full
 * - No size and latency statistics are collected
 */
export interface IAsyncQueueIterator<T> {
    push(value: T): void;
    end(): void;
    error(err: Error): void;
    [Symbol.asyncIterator](): AsyncGenerator<T, void>;
}
export declare function buildAsyncQueueIterator<T>(): IAsyncQueueIterator<T>;
//# sourceMappingURL=build-async-queue-iterator.d.ts.map