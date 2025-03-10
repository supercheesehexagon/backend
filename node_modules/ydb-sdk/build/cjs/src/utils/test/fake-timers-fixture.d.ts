/**
 * Guarantees that once the time has arrived, all functions called from setTimeout() will be finished by the time
 * await fakeTimersFixture.advanceTimer(...) ends.  It is important if an async function is passed to setTimeout().
 */
export declare class FakeTimersFixture {
    setup(): void;
    advanceTimer(msToRun: number): Promise<void>;
    dispose(): void;
    private prevSetTimeout?;
    private timeouts;
}
//# sourceMappingURL=fake-timers-fixture.d.ts.map