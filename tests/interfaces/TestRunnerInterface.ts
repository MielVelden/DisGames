export interface TestCase {
    name: string;
    testFunction: () => Promise<void>;
    timeout?: number;
    skip?: boolean;
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
    error?: string;
}

export interface TestRunResults {
    results: TestResult[];
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    duration: number;
}