import { UsersModel, UsersSaveModel } from '../../src/interfaces/database/TableInterfaces';

export const TEST_USERS: UsersSaveModel[] = [
    {
        UserId: '123456789',
        Username: 'TestPlayer1'
    },
    {
        UserId: '987654321',
        Username: 'TestPlayer2'
    },
    {
        UserId: '555666777',
        Username: 'TestAdmin'
    },
    {
        UserId: '111222333',
        Username: 'TestBot'
    }
];

export const MOCK_USERS: UsersModel[] = TEST_USERS.map((user, index) => ({
    Id: index + 1,
    UserId: user.UserId!,
    Username: user.Username!
}));

export function getTestUser(userId: string): UsersModel | undefined {
    return MOCK_USERS.find(user => user.UserId === userId);
}

export function createTestUser(overrides: Partial<UsersSaveModel> = {}): UsersSaveModel {
    const defaultUser = TEST_USERS[0];
    return {
        ...defaultUser,
        ...overrides,
        UserId: overrides.UserId || `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
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
    createTestUser
};