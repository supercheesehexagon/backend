import { ISslCredentials } from './utils/ssl-credentials';
import { TableClient } from './table';
import { ClientOptions } from './utils';
import { IAuthService } from './credentials/i-auth-service';
import SchemeService from './schema/scheme-client';
import { QueryClient } from './query';
import { Logger } from './logger/simple-logger';
import { TopicClient } from './topic';
import { RetryStrategy } from './retries/retryStrategy';
export interface IPoolSettings {
    minLimit?: number;
    maxLimit?: number;
    keepAlivePeriod?: number;
}
export interface IDriverSettings {
    /**
     * @deprecated Use connectionString instead
     */
    endpoint?: string;
    /**
     * @deprecated Use connectionString instead
     */
    database?: string;
    connectionString?: string;
    authService: IAuthService;
    sslCredentials?: ISslCredentials;
    poolSettings?: IPoolSettings;
    clientOptions?: ClientOptions;
    retrier?: RetryStrategy;
    logger?: Logger;
}
export default class Driver {
    private logger;
    private discoveryService;
    private _topicClient?;
    private clientSettings;
    readonly tableClient: TableClient;
    readonly queryClient: QueryClient;
    readonly schemeClient: SchemeService;
    get topic(): TopicClient;
    constructor(settings: IDriverSettings);
    ready(timeout: number): Promise<boolean>;
    destroy(): Promise<void>;
}
//# sourceMappingURL=driver.d.ts.map