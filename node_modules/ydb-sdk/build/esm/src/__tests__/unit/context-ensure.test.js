"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const context_1 = require("../../context");
describe('ensureContext', () => {
    it('positional args', () => {
        class Test {
            noArgs(ctx) {
                expect(ctx instanceof context_1.Context).toBeTruthy();
            }
            posArgs(ctx, n, s) {
                expect(ctx instanceof context_1.Context).toBeTruthy();
                expect(n).toBe(12);
                expect(s).toBe('test');
            }
            static staticNoArgs(ctx) {
                expect(ctx instanceof context_1.Context).toBeTruthy();
            }
        }
        __decorate([
            (0, context_1.ensureContext)(true)
        ], Test.prototype, "noArgs", null);
        __decorate([
            (0, context_1.ensureContext)(true)
        ], Test.prototype, "posArgs", null);
        __decorate([
            (0, context_1.ensureContext)(true)
        ], Test, "staticNoArgs", null);
        const test = new Test();
        test.noArgs();
        test.noArgs(context_1.Context.createNew().ctx);
        test.posArgs(12, 'test');
        test.posArgs(context_1.Context.createNew().ctx, 12, 'test');
        Test.staticNoArgs();
    });
    it('named args', () => {
        class Test {
            // noArgs(): void;
            // noArgs(opts: {
            //     ctx?: Context,
            // }): void;
            noArgs(opts) {
                const ctx = opts.ctx;
                expect(ctx instanceof context_1.Context).toBeTruthy();
            }
            mismatchTypeOfArgs(n, s) {
                expect(n).toBe(12);
                expect(s).toBe('test');
            }
        }
        __decorate([
            (0, context_1.ensureContext)()
        ], Test.prototype, "noArgs", null);
        __decorate([
            (0, context_1.ensureContext)(false) // should throw error cause fire arg is not obj
        ], Test.prototype, "mismatchTypeOfArgs", null);
        const test = new Test();
        test.noArgs();
        test.noArgs({});
        test.noArgs({
            ctx: context_1.Context.createNew().ctx,
        });
        expect(() => test.mismatchTypeOfArgs(12, 'test')).rejects
            .toThrow('An object with options or undefined is expected as the first argument');
    });
});
