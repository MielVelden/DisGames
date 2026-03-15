import axios from 'axios';
import TestRunner from '../../TestRunner';
import { TestSuite } from '../../interfaces/TestRunnerInterface';
import { getConfigValue } from '../../../src/utils/application/Config';
import { EnvConfigEnum } from '../../../src/interfaces/enums/application/EnvConfigEnum';

export default function registerWebhookTests(runner: TestRunner): void {
    const debugWebhookUrl = getConfigValue(EnvConfigEnum.DEBUG_DISCORD_WEBHOOK_URL);

    const suite: TestSuite = {
        name: 'Discord Webhook',
        description: 'sends a test message to a Discord test-webhook and expects a 2xx/204 response',
        tests: [
            {
                name: 'should send a test webhook message successfully',
                description: 'sends a simple content payload to the test-webhook URL',
                skip: !debugWebhookUrl,
                timeout: 10000,
                testFunction: async () => {
                    const url = debugWebhookUrl as string;

                    const response = await axios.post(url, {
                        content: 'DisGames webhook integration test: hello from tests ✅'
                    });

                    if (response.status < 200 || response.status >= 300) {
                        throw new Error(`Unexpected status code from Discord webhook: ${response.status}`);
                    }
                }
            }
        ]
    };

    runner.addSuite(suite);
}


