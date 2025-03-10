"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const context_1 = require("../../context");
describe('Context.do', () => {
    beforeEach(() => {
        (0, context_1.setContextIdGenerator)(); // reset default
    });
    it('general', () => {
        const ctx = context_1.Context.createNew().ctx;
        function test(n) {
            expect(context_1.Context.get()).toBeDefined();
            expect(n).toBe(12);
            return n;
        }
        const res = ctx.do(() => test(12));
        expect(res).toBe(12);
    });
    it('async', async () => {
        const ctx = context_1.Context.createNew().ctx;
        async function test(n) {
            expect(context_1.Context.get()).toBeDefined();
            await new Promise((resolve) => {
                setTimeout(resolve, 0);
            });
            expect(() => context_1.Context.get()).toThrow(); // because it's after await
            expect(n).toBe(12);
            return n;
        }
        const res = await ctx.do(() => test(12));
        expect(res).toBe(12);
    });
    it('no current context', async () => {
        expect(() => context_1.Context.get())
            .toThrow(`"ctx" was either not passed through Context.do() or was already taken through Context.get()`);
    });
    it('unprocessed current context', async () => {
        const ctx = context_1.Context.createNew().ctx;
        ctx.do(() => {
            expect(() => ctx.do(() => { }))
                .toThrow(`There is a "ctx" that was passed through "ctx.do()" and was not processed till next "ctx.do()": 0001`);
        });
    });
});
