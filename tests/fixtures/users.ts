import { UsersModel, UsersSaveModel } from '../../src/interfaces/database/TableInterfaces';
import Logger from '../../src/utils/application/Logger';
import { TableEnum, UserRoleEnum } from '../../src/interfaces/enums';
import TestDatabase from '../config/TestDatabase';

export const TEST_USERS: UsersSaveModel[] = [
    {
        UserId: '123456789',
        Username: 'TestPlayer1',
        UserRoleEnum: UserRoleEnum.USER,
        CreatedAt: new Date()
    },
    {
        UserId: '987654321',
        Username: 'TestPlayer2',
        UserRoleEnum: UserRoleEnum.USER,
        CreatedAt: new Date()
    },
    {
        UserId: '555666777',
        Username: 'TestAdmin',
        UserRoleEnum: UserRoleEnum.ADMIN,
        CreatedAt: new Date()
    },
    {
        UserId: '111222333',
        Username: 'TestBot',
        UserRoleEnum: UserRoleEnum.SYSTEM,
        CreatedAt: new Date()
    }
];

export const MOCK_USERS: UsersModel[] = TEST_USERS.map((user, index) => ({
    Id: index + 1,
    UserId: user.UserId!,
    Username: user.Username!,
    OAuth2AccessToken: undefined!,
    UserRoleEnum: UserRoleEnum.USER,
    CreatedAt: new Date()
}));

export function getTestUser(userId: string): UsersModel | undefined {
    return MOCK_USERS.find(user => user.UserId === userId);
}

export async function createTestUserAsync(overrides: Partial<UsersSaveModel> = {}): Promise<UsersSaveModel> {
    const defaultUser = TEST_USERS[0];
    const user: UsersSaveModel = {
        ...defaultUser,
        ...overrides,
        UserId: overrides.UserId || `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Save user to database
    await TestDatabase.insertAsync(TableEnum.USERS, user);

    Logger.logDebug(`Created test user: ${user.UserId}`);
    return user;
}

export async function createTestUserByNameAsync(username: "Alice" | "Bob"): Promise<UsersSaveModel> {
    return createTestUserAsync({ Username: username });
}

export const TEST_USER_IDS = {
    PLAYER1: '123456789',
    PLAYER2: '987654321',
    ADMIN: '555666777',
    BOT: '111222333'
};

export default {
    TEST_USERS,
    MOCK_USERS,
    TEST_USER_IDS,
    getTestUser,
    createTestUserAsync
};