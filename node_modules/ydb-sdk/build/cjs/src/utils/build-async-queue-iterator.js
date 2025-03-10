"use strict";
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
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
        [Symbol.asyncIterator]() {
            return __asyncGenerator(this, arguments, function* _a() {
                if (isGeneratorInstantiated)
                    throw new Error('Сan be only ONE instance of the generator');
                isGeneratorInstantiated = true;
                while (true) {
                    if (error)
                        throw error;
                    if (queue.length > 0)
                        yield yield __await(queue.shift());
                    else if (isQueueOver)
                        return yield __await(void 0);
                    else { // nothing in the queue and it is not ended
                        const waitNextItemPromise = new Promise((resolve, reject) => {
                            waitNextItemPromiseResolve = resolve;
                            waitNextItemPromiseReject = reject;
                        });
                        const value = yield __await(waitNextItemPromise);
                        if (value === QUEUE_END)
                            return yield __await(void 0);
                        yield yield __await(value);
                    }
                }
            });
        },
    };
}
