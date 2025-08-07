import Logger from "../../src/utils/Logger";

export const TEST_CHANNELS = [
    '123456789',
    '555666777',
    '987654321'
];

export async function createTestChannelAsync(): Promise<string> {
    const channel = `test_channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    Logger.logInfo(`Created test channel: ${channel}`);
    return channel;
}