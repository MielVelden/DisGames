import * as dotenv from 'dotenv';
import * as path from 'path';
import { LogLevel } from '../../src/utils/application/Logger';
import { TestEnvironment } from '../interfaces/TestEnvironmentInterface';
import { getConfigValue } from '../../src/utils/application/Config';
import { EnvConfigEnum } from '../../src/interfaces/enums/application/EnvConfigEnum';

dotenv.config({ path: path.join(process.cwd(), '.env.test') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

export class TestConfig {
    private static _instance: TestConfig;
    private _environment: TestEnvironment;

    private constructor() {
        this._environment = {
            isTestMode: true,
            databaseUrl: getConfigValue(EnvConfigEnum.TEST_DATABASE_URL) || getConfigValue(EnvConfigEnum.DATABASE_URL) || '',
            logLevel: LogLevel.ERROR,
            testTimeout: getConfigValue(EnvConfigEnum.TEST_TIMEOUT) as number,
            rollbackTransactions: getConfigValue(EnvConfigEnum.TEST_ROLLBACK) as boolean || true
        };

        this.validateConfig();
    }

    public static getInstance(): TestConfig {
        if (!TestConfig._instance) {
            TestConfig._instance = new TestConfig();
        }
        return TestConfig._instance;
    }

    public get environment(): TestEnvironment {
        return this._environment;
    }

    private validateConfig(): void {
        if (!this._environment.databaseUrl) {
            throw new Error('DATABASE_URL or TEST_DATABASE_URL must be set in environment variables');
        }
    }

    public static reset(): void {
        TestConfig._instance = undefined as any;
    }
}

export default TestConfig.getInstance();