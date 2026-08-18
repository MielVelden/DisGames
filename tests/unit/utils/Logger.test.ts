import TestRunner from '../../TestRunner';
import { TestSuite } from '../../interfaces/TestRunnerInterface';
import Logger from '../../../src/utils/application/Logger';
import TestMode from '../../../src/utils/application/TestMode';
import AssertionHelpers from '../../helpers/AssertionHelpers';

export default function registerLoggerTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'Logger',
        description: 'Unit tests for debug-mode gating and thunk interpolation',

        tests: [
            {
                name: 'logDebug skips thunk interpolation when debug is off',
                testFunction: async () => {
                    const debugWasOn = TestMode.isDebugModeEnabled();
                    if (debugWasOn) TestMode.disableDebugMode();

                    try {
                        let calls = 0;
                        await Logger.logDebug(() => { calls++; return 'should-not-build'; });
                        AssertionHelpers.assertEqual(calls, 0, 'thunk must not be invoked when debug is off');
                    } finally {
                        if (debugWasOn) TestMode.enableDebugMode();
                    }
                }
            },

            {
                name: 'logDebug invokes thunk exactly once when debug is on',
                testFunction: async () => {
                    const debugWasOn = TestMode.isDebugModeEnabled();
                    TestMode.enableDebugMode();
                    try {
                        let calls = 0;
                        await Logger.logDebug(() => { calls++; return 'built'; });
                        AssertionHelpers.assertEqual(calls, 1, 'thunk runs once when debug is on');
                    } finally {
                        if (!debugWasOn) TestMode.disableDebugMode();
                    }
                }
            },

            {
                name: 'logDebug accepts plain strings as before',
                testFunction: async () => {
                    const debugWasOn = TestMode.isDebugModeEnabled();
                    TestMode.enableDebugMode();
                    try {
                        // No-throw is the contract: existing call sites stay compatible
                        await Logger.logDebug('plain string still works');
                        AssertionHelpers.assertTrue(true, 'string overload did not throw');
                    } finally {
                        if (!debugWasOn) TestMode.disableDebugMode();
                    }
                }
            },

            {
                name: 'isDebugEnabled reflects TestMode debug flag',
                testFunction: async () => {
                    const debugWasOn = TestMode.isDebugModeEnabled();

                    TestMode.enableDebugMode();
                    AssertionHelpers.assertTrue(Logger.isDebugEnabled(), 'should be true when TestMode debug is on');

                    TestMode.disableDebugMode();
                    // With TestMode enabled (test runner enabled it on boot), isDebugEnabled
                    // ignores DEBUG_MODE env. So disabling TestMode debug must report false.
                    AssertionHelpers.assertFalse(Logger.isDebugEnabled(), 'should be false when TestMode debug is off');

                    if (debugWasOn) TestMode.enableDebugMode();
                }
            }
        ]
    };

    runner.addSuite(suite);
}
