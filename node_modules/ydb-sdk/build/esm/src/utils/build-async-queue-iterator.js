"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAsyncQueueIterator = buildAsyncQueueIterator;
const QUEUE_END = Symbol('QUEUE_END');
function buildAsyncQueueIterator() {
    let waitNextItemPromiseResolve;
    let waitNextItemPromiseReject;
    const queue = [];
    let isQueueOver;
    let error;
    let isGeneratorInstantiated;
    return {
        push(value) {
            if (error)
                return; // queue is already droped
            if (isQueueOver)
                throw new Error('The queue has already been closed by calling end()');
            if (waitNextItemPromiseResolve) {
                waitNextItemPromiseResolve(value);
                waitNextItemPromiseResolve = waitNextItemPromiseReject = undefined;
            }
            else {
                queue.push(value);
            }
        },
        end() {
            if (isQueueOver)
                throw new Error('The queue has already been closed by calling end()');
            isQueueOver = true;
            if (waitNextItemPromiseResolve)
                waitNextItemPromiseResolve(QUEUE_END);
            waitNextItemPromiseResolve = waitNextItemPromiseReject = undefined;
        },
        error(err) {
            error = err;
            queue.length = 0; // drop queue
            if (waitNextItemPromiseReject)
                waitNextItemPromiseReject(err);
            waitNextItemPromiseResolve = waitNextItemPromiseReject = undefined;
        },
        async *[Symbol.asyncIterator]() {
            if (isGeneratorInstantiated)
                throw new Error('Сan be only ONE instance of the generator');
            isGeneratorInstantiated = true;
            while (true) {
                if (error)
                    throw error;
                if (queue.length > 0)
                    yield queue.shift();
                else if (isQueueOver)
                    return;
                else { // nothing in the queue and it is not ended
                    const waitNextItemPromise = new Promise((resolve, reject) => {
                        waitNextItemPromiseResolve = resolve;
                        waitNextItemPromiseReject = reject;
                    });
                    const value = await waitNextItemPromise;
                    if (value === QUEUE_END)
                        return;
                    yield value;
                }
            }
        },
    };
}
