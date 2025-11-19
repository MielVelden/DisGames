import { generateDisGamesTypes } from '../../src/utils/api/GenerateApiTypes';
import AssertionHelpers from '../helpers/AssertionHelpers';
import TestRunner from '../TestRunner';
import { TestSuite } from '../interfaces/TestRunnerInterface';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { ESLint } from 'eslint';

const TEMP_DIR = path.join(__dirname, '..', '..', 'temp');

export default function registerTypeGeneratorTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'DisGames Type Generator',
        description: 'Validation tests for generated DisGames TypeScript definitions',

        setup: async () => {
            try {
                if (!fs.existsSync(TEMP_DIR))
                    fs.mkdirSync(TEMP_DIR, { recursive: true });

                const tempApiClientFile = path.join(TEMP_DIR, 'api-client.ts');
                fs.writeFileSync(tempApiClientFile, `export const apiClient = {} as any;`);
            } catch (error: any) {
                console.error('Error creating temp directory:', error);
            }
        },

        teardown: async () => {
            try {
                const tempApiClientFile = path.join(TEMP_DIR, 'api-client.ts');
                if (fs.existsSync(tempApiClientFile))
                    fs.unlinkSync(tempApiClientFile);

                const tempFile = path.join(TEMP_DIR, 'generated-types.ts');
                if (fs.existsSync(tempFile))
                    fs.unlinkSync(tempFile);

                if (fs.existsSync(TEMP_DIR))
                    fs.rmdirSync(TEMP_DIR);
            } catch (error: any) {
                console.error('Error deleting temp files:', error);
            }
        },
        tests: [
            {
                name: 'should generate valid TypeScript definitions',
                testFunction: async () => {
                    const tempFile = path.join(TEMP_DIR, 'generated-types.ts');
                    const generatedCode = await generateDisGamesTypes();

                    AssertionHelpers.assertTrue(typeof generatedCode === 'string', 'Generated code should be a string');
                    AssertionHelpers.assertGreaterThan(generatedCode.length, 0, 'Generated code should not be empty');

                    const lineCount = generatedCode.split(/\r?\n/).length;
                    AssertionHelpers.assertGreaterThan(lineCount, 100, 'Generated code should contain more than 100 lines');

                    fs.writeFileSync(tempFile, generatedCode, 'utf-8');

                    const tscCommand = `npx tsc --noEmit --skipLibCheck ${tempFile}`;
                    let compilationSuccess = true;
                    let errorOutput = '';

                    try {
                        execSync(tscCommand, {
                            cwd: path.join(__dirname, '..', '..'),
                            stdio: 'pipe',
                            encoding: 'utf-8'
                        });
                    } catch (error: any) {
                        compilationSuccess = false;
                        errorOutput = error.stderr || error.stdout || error.message;
                    }

                    AssertionHelpers.assertTrue(compilationSuccess, `TypeScript compilation should succeed. Error: ${errorOutput}`);
                }
            },

            {
                name: 'should contain expected type definitions',
                testFunction: async () => {
                    const generatedCode = await generateDisGamesTypes();

                    AssertionHelpers.assertTrue(
                        generatedCode.includes('export namespace DisGames.Interfaces.Application'),
                        'Generated code should contain Application namespace'
                    );
                    AssertionHelpers.assertTrue(
                        generatedCode.includes('export namespace DisGames.Interfaces.Database'),
                        'Generated code should contain Database namespace'
                    );
                    AssertionHelpers.assertTrue(
                        generatedCode.includes('export namespace DisGames.Interfaces.Domain'),
                        'Generated code should contain Domain namespace'
                    );
                    AssertionHelpers.assertTrue(
                        generatedCode.includes('export namespace DisGames.Interfaces.Enums'),
                        'Generated code should contain Enums namespace'
                    );
                    AssertionHelpers.assertTrue(
                        generatedCode.includes('export namespace DisGames.Interfaces.View'),
                        'Generated code should contain View namespace'
                    );
                    AssertionHelpers.assertTrue(
                        generatedCode.includes('export const DisGamesApi'),
                        'Generated code should contain DisGamesApi wrapper'
                    );
                }
            },

            {
                name: 'should pass ESLint validation',
                testFunction: async () => {
                    const tempFile = path.join(TEMP_DIR, 'generated-types.ts');

                    const generatedCode = await generateDisGamesTypes();
                    fs.writeFileSync(tempFile, generatedCode, 'utf-8');

                    const eslint = new ESLint({
                        overrideConfigFile: path.join(__dirname, '..', '..', 'eslint.config.mjs'),
                        warnIgnored: false
                    });

                    const results = await eslint.lintFiles([tempFile]);
                    const errorCount = results.reduce((sum, result) => sum + result.errorCount, 0);
                    const warningCount = results.reduce((sum, result) => sum + result.warningCount, 0);

                    const formatter = await eslint.loadFormatter('stylish');
                    const formattedResults = await formatter.format(results);

                    AssertionHelpers.assertEqual(
                        errorCount,
                        0,
                        `Generated code should have no ESLint errors. Results:\n${formattedResults}`
                    );

                    AssertionHelpers.assertEqual(
                        warningCount,
                        0,
                        `Generated code should have no ESLint warnings. Results:\n${formattedResults}`
                    );
                }
            }
        ]
    };

    runner.addSuite(suite);
}

