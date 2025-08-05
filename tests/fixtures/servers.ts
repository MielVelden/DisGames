import { ServersModel, ServersSaveModel } from '../../src/interfaces/database/TableInterfaces';
import { LanguageEnum } from '../../src/interfaces/enums/database/LanguageEnum';

export const TEST_SERVERS: ServersSaveModel[] = [
    {
        ServerId: '987654321',
        LanguageEnum: LanguageEnum.NL,
        Points: 0
    },
    {
        ServerId: '123456789',
        LanguageEnum: LanguageEnum.EN,
        Points: 100
    },
    {
        ServerId: '555666777',
        LanguageEnum: LanguageEnum.NL,
        Points: 50
    }
];

export const MOCK_SERVERS: ServersModel[] = TEST_SERVERS.map((server, index) => ({
    Id: index + 1,
    ServerId: server.ServerId || 'default',
    LanguageEnum: server.LanguageEnum || LanguageEnum.NL,
    Points: server.Points || 0
}));

export function getTestServer(serverId: string): ServersModel | undefined {
    return MOCK_SERVERS.find(server => server.ServerId === serverId);
}

export function createTestServer(overrides: Partial<ServersSaveModel> = {}): ServersSaveModel {
    const defaultServer = TEST_SERVERS[0];
    return {
        ...defaultServer,
        ...overrides,
        ServerId: overrides.ServerId || `test_server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
}

export const TEST_SERVER_IDS = {
    MAIN_SERVER: '987654321',
    ENGLISH_SERVER: '123456789',
    TEST_SERVER: '555666777'
};

export const TEST_CHANNEL_IDS = {
    MAIN_CHANNEL: '111222333',
    GAME_CHANNEL: '444555666',
    TEST_CHANNEL: '777888999'
};

export default {
    TEST_SERVERS,
    MOCK_SERVERS,
    TEST_SERVER_IDS,
    TEST_CHANNEL_IDS,
    getTestServer,
    createTestServer
};