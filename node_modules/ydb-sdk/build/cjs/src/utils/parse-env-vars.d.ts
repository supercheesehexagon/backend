import { IIamCredentials } from "../credentials/iam-auth-service";
import { IAuthService } from "../credentials/i-auth-service";
import { Logger } from "../logger/simple-logger";
export declare function getSACredentialsFromJson(filename: string): IIamCredentials;
export declare function getCredentialsFromEnv(logger?: Logger): IAuthService;
//# sourceMappingURL=parse-env-vars.d.ts.map