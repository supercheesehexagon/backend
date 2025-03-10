"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeTimersFixture = void 0;
/**
 * Guarantees that once the time has arrived, all functions called from setTimeout() will be finished by the time
 * await fakeTimersFixture.advanceTimer(...) ends.  It is important if an async function is passed to setTimeout().
 */
class FakeTimersFixture {
    setup() {
        jest.useFakeTimers();
        // @ts-ignore
        this.prevSetTimeout = global.setTimeout;
        // adds to this.timesouts array the handlers for which the time has come. so whould be possible to make sure that all handlers,
        // including asynchronous handlers, will be completed - see below.
        // @ts-ignore
        global.setTimeout = (handler, timeout, ...args) => this.prevSetTimeout?.(() => {
            this.timeouts.push(handler(...args)); // call the handler only when the fake timer comes to necessary point if time
        }, timeout);
    }
    async advanceTimer(msToRun) {
        jest.advanceTimersByTime(msToRun);
        // this additional logic ensures that by the end of advanceTimer(), all handlers including asynchronous
        // handlers on timers will be completed
        // eslint-disable-next-line @typescript-eslint/ban-types
        await Promise.all(this.timeouts);
        this.timeouts.length = 0;
    }
    dispose() {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        global.setTimeout = this.prevSetTimeout;
        jest.useRealTimers();
    }
    prevSetTimeout;
    timeouts = [];
}
exports.FakeTimersFixture = FakeTimersFixture;
