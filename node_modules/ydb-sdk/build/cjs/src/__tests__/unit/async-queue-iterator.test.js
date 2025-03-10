"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const build_async_queue_iterator_1 = require("../../utils/build-async-queue-iterator");
describe('asyncQueueIterator', () => {
    let q;
    beforeEach(() => {
        q = (0, build_async_queue_iterator_1.buildAsyncQueueIterator)();
    });
    it('push first then dequeue', async () => {
        var _a, e_1, _b, _c;
        for (let n = 0; n < 4; n++)
            q.push(n);
        q.end();
        const arr = [];
        try {
            for (var _d = true, q_1 = __asyncValues(q), q_1_1; q_1_1 = await q_1.next(), _a = q_1_1.done, !_a; _d = true) {
                _c = q_1_1.value;
                _d = false;
                const v = _c;
                arr.push(v);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = q_1.return)) await _b.call(q_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        expect(arr).toEqual([0, 1, 2, 3]);
    });
    it('dequeue first then data received', async () => {
        const arr = [];
        const readerPromise = new Promise(async (resolve) => {
            var _a, e_2, _b, _c;
            try {
                for (var _d = true, q_2 = __asyncValues(q), q_2_1; q_2_1 = await q_2.next(), _a = q_2_1.done, !_a; _d = true) {
                    _c = q_2_1.value;
                    _d = false;
                    const v = _c;
                    arr.push(v);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = q_2.return)) await _b.call(q_2);
                }
                finally { if (e_2) throw e_2.error; }
            }
            resolve(undefined);
        });
        for (let n = 0; n < 4; n++)
            q.push(n);
        q.end();
        await readerPromise;
        expect(arr).toEqual([0, 1, 2, 3]);
    });
    it('empty queue', async () => {
        var _a, e_3, _b, _c;
        q.end();
        const arr = [];
        try {
            for (var _d = true, q_3 = __asyncValues(q), q_3_1; q_3_1 = await q_3.next(), _a = q_3_1.done, !_a; _d = true) {
                _c = q_3_1.value;
                _d = false;
                const v = _c;
                arr.push(v);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = q_3.return)) await _b.call(q_3);
            }
            finally { if (e_3) throw e_3.error; }
        }
        expect(arr).toEqual([]);
    });
    it('starts from error', async () => {
        q.error(new Error('test'));
        await expect(async () => {
            var _a, e_4, _b, _c;
            try {
                for (var _d = true, q_4 = __asyncValues(q), q_4_1; q_4_1 = await q_4.next(), _a = q_4_1.done, !_a; _d = true) {
                    _c = q_4_1.value;
                    _d = false;
                    const _ = _c;
                    expect(false).toBeTruthy();
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = q_4.return)) await _b.call(q_4);
                }
                finally { if (e_4) throw e_4.error; }
            }
        }).rejects.toThrowError(new Error('test'));
    });
    it('dequeue first then error', async () => {
        const w = new Promise(async (resolve) => {
            await expect(async () => {
                await q[Symbol.asyncIterator]().next();
            }).rejects.toThrowError(new Error('test'));
            resolve(undefined);
        });
        q.error(new Error('test'));
        await w;
    });
    it('dequeue first then the queue end', async () => {
        const w = new Promise(async (resolve) => {
            await expect((await q[Symbol.asyncIterator]().next()).done).toBeTruthy();
            resolve(undefined);
        });
        q.end();
        await w;
    });
    it('push stays ok after an error', async () => {
        q.error(new Error('test'));
        q.push(12);
    });
    it('restriction: only one instance of generator is allowed', async () => {
        var _a, e_5, _b, _c;
        q.end();
        try {
            for (var _d = true, q_5 = __asyncValues(q), q_5_1; q_5_1 = await q_5.next(), _a = q_5_1.done, !_a; _d = true) {
                _c = q_5_1.value;
                _d = false;
                const _ = _c;
                ;
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = q_5.return)) await _b.call(q_5);
            }
            finally { if (e_5) throw e_5.error; }
        }
        await expect(async () => {
            var _a, e_6, _b, _c;
            try {
                for (var _d = true, q_6 = __asyncValues(q), q_6_1; q_6_1 = await q_6.next(), _a = q_6_1.done, !_a; _d = true) {
                    _c = q_6_1.value;
                    _d = false;
                    const _ = _c;
                    ;
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = q_6.return)) await _b.call(q_6);
                }
                finally { if (e_6) throw e_6.error; }
            }
        }).rejects.toThrowError(new Error('Сan be only ONE instance of the generator'));
    });
    it('restriction: no call of push() or end() after end()', async () => {
        q.end();
        await expect(async () => {
            q.push(12);
        }).rejects.toThrowError(new Error('The queue has already been closed by calling end()'));
        await expect(async () => {
            q.end();
        }).rejects.toThrowError(new Error('The queue has already been closed by calling end()'));
    });
});
