import TestRunner from '../../TestRunner';
import { TestSuite } from '../../interfaces/TestRunnerInterface';
import AssertionHelpers from '../../helpers/AssertionHelpers';
import BaseRepository from '../../../src/repositories/BaseRepository';
import {
    UsersModel,
    UsersModelFieldEnum,
    UsersSaveModel,
    getUsersFieldType,
} from '../../../src/interfaces/database/TableInterfaces';
import { TableEnum, UserRoleEnum } from '../../../src/interfaces/enums';
import { getTableName } from '../../../src/repositories/util/ConnectionHandler';
import TestDatabase from '../../config/TestDatabase';

function makeFreshUserRepo() {
    return new BaseRepository<UsersModel, UsersSaveModel, typeof UsersModelFieldEnum>(
        TableEnum.USERS,
        UsersModelFieldEnum,
        getUsersFieldType,
    );
}

async function insertTestUser(userId: string, username: string): Promise<number> {
    const tableName = getTableName(TableEnum.USERS);
    await TestDatabase.runQueryAsync(
        `INSERT INTO ${tableName} (UserId, Username, UserRoleEnum, CreatedAt) VALUES (?, ?, ?, NOW())`,
        [userId, username, UserRoleEnum.USER],
    );
    const idRows = await TestDatabase.runQueryAsync(
        `SELECT Id FROM ${tableName} WHERE UserId = ? ORDER BY Id DESC LIMIT 1`,
        [userId],
    );
    return (idRows![0] as { Id: number }).Id;
}

interface Spy {
    executeCalls: number;
    queryCalls: number;
    restore: () => void;
}

function spyOnAmbientTx(): Spy {
    const tx = (TestDatabase as any)._tx;
    if (!tx)
        throw new Error('No ambient transaction handle on TestDatabase');
    const conn = tx.connection;
    const origExecute = conn.execute.bind(conn);
    const origQuery = conn.query.bind(conn);
    const spy: Spy = {
        executeCalls: 0,
        queryCalls: 0,
        restore: () => {
            conn.execute = origExecute;
            conn.query = origQuery;
        },
    };
    conn.execute = ((...args: any[]) => { spy.executeCalls++; return origExecute(...args); }) as any;
    conn.query = ((...args: any[]) => { spy.queryCalls++; return origQuery(...args); }) as any;
    return spy;
}

export default function registerBaseRepositoryTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'BaseRepository',
        description: 'Save() cache-merge, execute() routing, and INSERT round-trip',

        tests: [
            {
                name: 'Save UPDATE with cache hit returns merged entity (skips SELECT round-trip)',
                testFunction: async () => {
                    const repo = makeFreshUserRepo();
                    const id = await insertTestUser(`hot-${Date.now()}-${Math.random()}`, 'OriginalName');

                    // Warm the cache by reading the row through the repo
                    const before = await repo.getById(id);
                    AssertionHelpers.assertNotNull(before, 'before snapshot exists');

                    const spy = spyOnAmbientTx();
                    let saved: UsersModel;
                    try {
                        saved = await repo.Save({ Id: id, Username: 'UpdatedName' });
                    } finally {
                        spy.restore();
                    }

                    AssertionHelpers.assertEqual(spy.executeCalls, 1, 'exactly one execute() call (the UPDATE)');
                    AssertionHelpers.assertEqual(spy.queryCalls, 0, 'no query() call — cache hit avoided the SELECT round-trip');

                    AssertionHelpers.assertEqual(saved.Username, 'UpdatedName', 'returned model carries the new value');
                    AssertionHelpers.assertEqual(saved.UserId, before!.UserId, 'returned model preserves cached fields');
                }
            },

            {
                name: 'Save UPDATE with cold cache falls back to SELECT',
                testFunction: async () => {
                    const repo = makeFreshUserRepo();
                    const id = await insertTestUser(`cold-${Date.now()}-${Math.random()}`, 'OriginalName');

                    // Do NOT prime the cache — go straight to Save
                    repo.clearCache();

                    const spy = spyOnAmbientTx();
                    let saved: UsersModel;
                    try {
                        saved = await repo.Save({ Id: id, Username: 'ColdCacheName' });
                    } finally {
                        spy.restore();
                    }

                    // UPDATE + the cold-fallback SELECT both go through execute()
                    AssertionHelpers.assertEqual(spy.executeCalls, 2, 'two execute() calls (UPDATE + cold-fallback SELECT)');
                    AssertionHelpers.assertEqual(spy.queryCalls, 0, 'no query() call (SELECT goes through execute())');
                    AssertionHelpers.assertEqual(saved.Username, 'ColdCacheName', 'returned model has new value');
                }
            },

            {
                name: 'Save UPDATE with no fields to update still returns the row',
                testFunction: async () => {
                    const repo = makeFreshUserRepo();
                    const id = await insertTestUser(`noop-${Date.now()}-${Math.random()}`, 'NoOp');

                    const saved = await repo.Save({ Id: id });
                    AssertionHelpers.assertEqual(saved.Id, id, 'returned model has same id');
                    AssertionHelpers.assertEqual(saved.Username, 'NoOp', 'returned model has original value');
                }
            },

            {
                name: 'Save INSERT chains LAST_INSERT_ID and returns populated row',
                testFunction: async () => {
                    const repo = makeFreshUserRepo();
                    const userId = `ins-${Date.now()}-${Math.random()}`;

                    const created = await repo.Save({
                        UserId: userId,
                        Username: 'Inserted',
                        UserRoleEnum: UserRoleEnum.USER,
                    });

                    AssertionHelpers.assertGreaterThan(created.Id, 0, 'Insert returned a positive Id');
                    AssertionHelpers.assertEqual(created.UserId, userId, 'returned UserId matches');
                    AssertionHelpers.assertEqual(created.Username, 'Inserted', 'returned Username matches');
                }
            },

            {
                name: 'Execute() routes a LIMIT-free SELECT through execute()',
                testFunction: async () => {
                    const repo = makeFreshUserRepo();
                    const userId = `sel-${Date.now()}-${Math.random()}`;
                    await insertTestUser(userId, 'ExecuteRouting');

                    const spy = spyOnAmbientTx();
                    try {
                        // No .Limit() → query has no LIMIT ?, so prepared-statement path is used.
                        const rows = await repo.Select().Where({ UserId: userId }).Execute();
                        AssertionHelpers.assertEqual(rows.length, 1, 'select returns 1 row');
                    } finally {
                        spy.restore();
                    }

                    AssertionHelpers.assertGreaterThan(spy.executeCalls, 0, 'Select hit execute() at least once');
                    AssertionHelpers.assertEqual(spy.queryCalls, 0, 'Select did not use query()');
                }
            },

            {
                name: 'Execute() with LIMIT auto-falls back to query() (older-MySQL safety)',
                testFunction: async () => {
                    const repo = makeFreshUserRepo();
                    const userId = `lim-${Date.now()}-${Math.random()}`;
                    await insertTestUser(userId, 'LimitFallback');

                    const spy = spyOnAmbientTx();
                    try {
                        const rows = await repo.Select().Where({ UserId: userId }).Limit(1).Execute();
                        AssertionHelpers.assertEqual(rows.length, 1, 'select returns 1 row');
                    } finally {
                        spy.restore();
                    }

                    // LIMIT ? must route to query() for compatibility with older MySQL prepared protocol
                    AssertionHelpers.assertGreaterThan(spy.queryCalls, 0, 'LIMIT ? fell back to query()');
                }
            }
        ]
    };

    runner.addSuite(suite);
}
