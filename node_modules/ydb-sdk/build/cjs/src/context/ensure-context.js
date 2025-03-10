"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureContext = ensureContext;
const context_1 = require("./context");
/**
 * Decorator that ensures:
 * - in the case of positional arguments, the first argument type is Context.
 * - in case of named arguments there is a non-null named argument ctx of type Context.
 *
 * If the context was not passed in the initial parameters, a new context with a unique id
 * will be added to the parameters by this decorator.
 *
 * @param isPositionalArgs
 */
function ensureContext(isPositionalArgs) {
    return (_target, _propertyKey, descriptor) => {
        const originalMethod = descriptor.value;
        // const wrappedMethodName = `${target.constructor.name}::${propertyKey}`; // for regular method
        // const wrappedMethodName = ???; // for static method
        descriptor.value = async function (...args) {
            if (isPositionalArgs) {
                if (!(args[0] instanceof context_1.Context)) {
                    args.unshift(context_1.Context.createNew().ctx);
                }
            }
            else {
                let opts = args[0];
                if (opts === undefined)
                    args[0] = opts = {};
                else if (!(typeof opts === 'object' && opts !== null))
                    throw new Error('An object with options or undefined is expected as the first argument');
                if (!(opts.ctx instanceof context_1.Context))
                    opts.ctx = context_1.Context.createNew().ctx;
            }
            return originalMethod.apply(this, args);
        };
    };
}
