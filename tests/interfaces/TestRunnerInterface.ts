export interface TestCase {
    name: string;
    description?: string;
    testFunction: () => Promise<void>;
    timeout?: number;
    skip?: boolean;
    only?: boolean;
    /**
     * If true, the test body runs OUTSIDE the per-test database transaction.
     * Required for tests that exercise the pool/transaction layer itself, or that
     * need parallel connections (the ambient transaction pins everything to one).
     */
    bypassTransaction?: boolean;
}

export interface TestSuite {
    name: string;
    description?: string;
    setup?: () => Promise<void>;
    teardown?: () => Promise<void>;
    beforeEach?: () => Promise<void>;
    afterEach?: () => Promise<void>;
    tests: TestCase[];
}

export interface TestResult {
    suite: string;
    test: string;
    success: boolean;
    duration: number;
    error?: Error;
}

export interface TestRunResults {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    results: TestResult[];
}
