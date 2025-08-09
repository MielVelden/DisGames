export interface TestCase {
    name: string;
    description?: string;
    testFunction: () => Promise<void>;
    timeout?: number;
    skip?: boolean;
    only?: boolean;
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
