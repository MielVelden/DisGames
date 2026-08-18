import TestRunner from '../../TestRunner';
import { TestSuite } from '../../interfaces/TestRunnerInterface';
import { MultiLingualString } from '../../../src/utils/i18n/MultiLingualString';
import { LanguageEnum } from '../../../src/interfaces/enums/database/LanguageEnum';
import AssertionHelpers from '../../helpers/AssertionHelpers';

export default function registerMultiLingualStringTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'MultiLingualString',
        description: 'Unit tests for translation lookup and parameter substitution',

        tests: [
            {
                name: 'returns value for requested language',
                testFunction: async () => {
                    const str = new MultiLingualString({
                        [LanguageEnum.EN]: 'Hello',
                        [LanguageEnum.NL]: 'Hallo'
                    });

                    AssertionHelpers.assertEqual(str.getMessage(LanguageEnum.EN), 'Hello', 'EN value');
                    AssertionHelpers.assertEqual(str.getMessage(LanguageEnum.NL), 'Hallo', 'NL value');
                }
            },

            {
                name: 'falls back to EN when requested language missing',
                testFunction: async () => {
                    const str = new MultiLingualString({
                        [LanguageEnum.EN]: 'Fallback'
                    } as any);

                    AssertionHelpers.assertEqual(str.getMessage(LanguageEnum.NL), 'Fallback', 'Missing NL should fall back to EN');
                }
            },

            {
                name: 'substitutes a single parameter',
                testFunction: async () => {
                    const str = new MultiLingualString(
                        { [LanguageEnum.EN]: 'Hello {name}!', [LanguageEnum.NL]: 'Hallo {name}!' },
                        { name: 'Miel' }
                    );

                    AssertionHelpers.assertEqual(str.getMessage(LanguageEnum.EN), 'Hello Miel!', 'Single param substituted');
                }
            },

            {
                name: 'substitutes multiple parameters',
                testFunction: async () => {
                    const str = new MultiLingualString(
                        { [LanguageEnum.EN]: '{a} + {b} = {c}', [LanguageEnum.NL]: '{a} + {b} = {c}' },
                        { a: '1', b: '2', c: '3' }
                    );

                    AssertionHelpers.assertEqual(str.getMessage(LanguageEnum.EN), '1 + 2 = 3', 'All params substituted');
                }
            },

            {
                name: 'leaves unknown placeholders untouched',
                testFunction: async () => {
                    const str = new MultiLingualString(
                        { [LanguageEnum.EN]: 'Hi {name}', [LanguageEnum.NL]: 'Hi {name}' },
                        {}
                    );

                    AssertionHelpers.assertEqual(str.getMessage(LanguageEnum.EN), 'Hi {name}', 'Unknown placeholder preserved');
                }
            }
        ]
    };

    runner.addSuite(suite);
}
