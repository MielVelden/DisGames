export interface TestEnvironment {
    isTestMode: boolean;
    testDatabaseUrl?: string;
    rollbackTransactions: boolean;
    mockDiscordEvents: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
}