import { LogLevel } from "../../src/utils/application/Logger";

export interface TestEnvironment {
    isTestMode: boolean;
    databaseUrl: string;
    logLevel: LogLevel;
    testTimeout: number;
}