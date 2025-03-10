import { Endpoint } from "../discovery";
export interface Pessimizable {
    endpoint: Endpoint;
}
/**
 * The jrpc session connection is pessimized in case of errors on keepALive for the table service and in case the alive connection is broken
 * in the query service.  The session remains in the pool.  Pessimization is removed after discovery serv information is updated.
 */
export declare function pessimizable(_target: Pessimizable, _propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
//# sourceMappingURL=pessimizable.d.ts.map