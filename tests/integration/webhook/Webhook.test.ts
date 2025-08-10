import axios from 'axios';
import TestRunner from '../../TestRunner';
import { TestSuite } from '../../interfaces/TestRunnerInterface';

export default function registerWebhookTests(runner: TestRunner): void {
    const testWebhookUrl = process.env.TEST_DISCORD_WEBHOOK_URL;

    const suite: TestSuite = {
        name: 'Discord Webhook',
        description: 'Verstuurt een testbericht naar een Discord test-webhook en verwacht een 2xx/204 respons',
        tests: [
            {
                name: 'should send a test webhook message successfully',
                description: 'Stuurt een simpele content payload naar de test-webhook URL',
                skip: !testWebhookUrl,
                timeout: 10000,
                testFunction: async () => {
                    const url = testWebhookUrl as string;

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


