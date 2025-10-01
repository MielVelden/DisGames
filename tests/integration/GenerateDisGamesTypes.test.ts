import { generateDisGamesTypes } from '../../src/utils/frontendapi/GenerateDisGamesTypes';
import AssertionHelpers from '../helpers/AssertionHelpers';
import TestRunner from '../TestRunner';
import { TestSuite } from '../interfaces/TestRunnerInterface';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export default function registerTypeGeneratorTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'DisGames Type Generator',
        description: 'Validation tests for generated DisGames TypeScript definitions',

        setup: async () => {
        },

        teardown: async () => {
        },

        tests: [
            {
                name: 'should generate valid TypeScript definitions',
                testFunction: async () => {
                    const tempDir = path.join(__dirname, '..', '..', 'temp');
                    const tempFile = path.join(tempDir, 'generated-types.ts');

                    try {
                        if (!fs.existsSync(tempDir)) {
                            fs.mkdirSync(tempDir, { recursive: true });
                        }

                        const generatedCode = await generateDisGamesTypes();

                        AssertionHelpers.assertTrue(typeof generatedCode === 'string', 'Generated code should be a string');
                        AssertionHelpers.assertGreaterThan(generatedCode.length, 0, 'Generated code should not be empty');

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
                    } finally {
                        if (fs.existsSync(tempFile)) {
                            fs.unlinkSync(tempFile);
                        }
                    }
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
            }
        ]
    };

    runner.addSuite(suite);
}

