import { GamesModel, GamesSaveModel } from '../../src/interfaces/database/TableInterfaces';
import { GameSettingType } from '../../src/interfaces/domain';
import { TableEnum } from '../../src/interfaces/enums';
import { GameTypeEnum } from '../../src/interfaces/enums/database/GameTypeEnum';
import Logger from '../../src/utils/Logger';
import TestInputSimulator from '../builders/TestInputSimulator';
import TestDatabase from '../config/TestDatabase';
import { GameFlowTestConfig } from '../interfaces/GameFlowInterface';
import { createTestChannelAsync } from './channels';
import { TEST_SERVER_IDS, TEST_CHANNEL_IDS, createTestServerAsync } from './servers';
import { TEST_USER_IDS } from './users';

export const TEST_GAMES: GamesSaveModel[] = [
    {
        ChannelId: TEST_CHANNEL_IDS.MAIN_CHANNEL,
        ServerId: TEST_SERVER_IDS.MAIN_SERVER,
        GameTypeEnum: GameTypeEnum.ANAGRAM,
        Answer: 'test',
        SettingsJSON: {
            difficulty: 'medium',
        } as any
    },
    {
        ChannelId: TEST_CHANNEL_IDS.GAME_CHANNEL,
        ServerId: TEST_SERVER_IDS.ENGLISH_SERVER,
        GameTypeEnum: GameTypeEnum.NUMBER_GUESS,
        Answer: '42',
        SettingsJSON: {
            minNumber: 1,
            maxNumber: 100
        } as any
    },
    {
        ChannelId: TEST_CHANNEL_IDS.TEST_CHANNEL,
        ServerId: TEST_SERVER_IDS.TEST_SERVER,
        GameTypeEnum: GameTypeEnum.COUNTING,
        Answer: '1',
        SettingsJSON: {
            startNumber: 1
        } as any
    }
];

export const MOCK_GAMES: GamesModel[] = TEST_GAMES.map((game, index) => ({
    Id: index + 1,
    ...game,
    Answer: game.Answer || 'default',
    ChannelId: game.ChannelId || 'default',
    ServerId: game.ServerId || 'default',
    GameTypeEnum: game.GameTypeEnum || GameTypeEnum.ANAGRAM,
    LastUser: game.LastUser || '',
    MessageId: game.MessageId || '',
    Settings: game.SettingsJSON || {} as any
}));

export function getTestGame(gameType: GameTypeEnum): GamesModel | undefined {
    return MOCK_GAMES.find(game => game.GameTypeEnum === gameType);
}

export async function createTestGameAsync(overrides: Partial<GamesSaveModel> = {}, skipDatabaseInsert: boolean = false): Promise<GamesModel> {
    const defaultGame = TEST_GAMES[0];
    const game = {
        ...defaultGame,
        ...overrides,
        ChannelId: overrides.ChannelId || `test_channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ServerId: overrides.ServerId || TEST_SERVER_IDS.MAIN_SERVER
    };
    
    // Remove Answer for new games unless explicitly provided
    if (!overrides.Answer) {
        delete game.Answer;
    }

    // Save game to database
    if (!skipDatabaseInsert) {
        const savedGame = await TestDatabase.insertAsync(TableEnum.GAMES, game);
        game.Id = savedGame.Id;
    }

    Logger.logInfo(`Created test game: ${game.GameTypeEnum} in server: ${game.ServerId}`);
    return game as GamesModel;
}

export const GAME_TEST_ANSWERS: Partial<Record<GameTypeEnum, string[]>> = {
    [GameTypeEnum.ANAGRAM]: ['cats', 'star', 'listen', 'silent'],
    [GameTypeEnum.NUMBER_GUESS]: ['50', '75', '87', '92', '95'],
    [GameTypeEnum.COUNTING]: ['1', '2', '3', '4', '5'],
    [GameTypeEnum.GUESS_THE_FLAG]: ['netherlands', 'germany', 'france', 'italy'],
    [GameTypeEnum.WORD_SNAKE]: ['apple', 'elephant', 'tiger', 'rabbit']
};

export const GAME_TEST_SETTINGS: Partial<Record<GameTypeEnum, any>> = {
    [GameTypeEnum.ANAGRAM]: {
        difficulty: 1, // medium
        timeLimit: 60,
        hints: true
    },
    [GameTypeEnum.NUMBER_GUESS]: {
        minNumber: 1,
        maxNumber: 100,
        maxAttempts: 10
    },
    [GameTypeEnum.COUNTING]: {
        startNumber: 1,
        increment: 1
    },
    [GameTypeEnum.GUESS_THE_FLAG]: {
        difficulty: 0, // easy
        region: 'europe'
    },
    [GameTypeEnum.WORD_SNAKE]: {
        difficulty: 1, // medium
        allowRepeats: false
    }
};

export async function createGameWithCorrectAnswerAsync(gameType: GameTypeEnum): Promise<GamesSaveModel> {
    const answers = GAME_TEST_ANSWERS[gameType] || ['test'];
    const settings = GAME_TEST_SETTINGS[gameType] || {};
    
    return await createTestGameAsync({
        GameTypeEnum: gameType,
        Answer: answers[0],
        SettingsJSON: settings as any
    });
}

export async function createGameFlowTestConfig(gameType: GameTypeEnum, inputSimulator?: TestInputSimulator): Promise<GameFlowTestConfig> {
    const answers = GAME_TEST_ANSWERS[gameType] || ['test'];
    const settings = GAME_TEST_SETTINGS[gameType] || {};
    
    const testServer = await createTestServerAsync();
    const testChannelId = await createTestChannelAsync();

    return {
        gameType: gameType,
        channelId: testChannelId,
        serverId: testServer.ServerId || TEST_SERVER_IDS.MAIN_SERVER,
        userId: TEST_USER_IDS.PLAYER1,
        expectedAnswers: answers.slice(0, 3),
        settings: settings,
        inputSimulator: inputSimulator
    };
}

export default {
    TEST_GAMES,
    MOCK_GAMES,
    GAME_TEST_ANSWERS,
    GAME_TEST_SETTINGS,
    getTestGame,
    createTestGame: createTestGameAsync,
    createGameWithCorrectAnswer: createGameWithCorrectAnswerAsync
};