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
export declare function ensureContext(isPositionalArgs?: boolean): (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => void;
//# sourceMappingURL=ensure-context.d.ts.map