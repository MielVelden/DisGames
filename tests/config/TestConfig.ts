import * as dotenv from 'dotenv';
import * as path from 'path';
import { LogLevel } from '../../src/utils/Logger';
import { TestEnvironment } from '../interfaces/TestEnvironmentInterface';

dotenv.config({ path: path.join(process.cwd(), '.env.test') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

export class TestConfig {
    private static _instance: TestConfig;
    private _environment: TestEnvironment;

    private constructor() {
        this._environment = {
            isTestMode: true,
            databaseUrl: process.env.DATABASE_URL || process.env.TEST_DATABASE_URL || '',
            logLevel: (process.env.TEST_LOG_LEVEL as LogLevel) || LogLevel.ERROR,
            testTimeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
            rollbackTransactions: process.env.TEST_ROLLBACK !== 'false'
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