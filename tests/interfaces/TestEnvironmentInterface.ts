import { LogLevel } from "../../src/utils/Logger";

export interface TestEnvironment {
    isTestMode: boolean;
    databaseUrl: string;
    logLevel: LogLevel;
    testTimeout: number;
    rollbackTransactions: boolean;
}