import TestRunner from '../../TestRunner';
import { TestSuite } from '../../interfaces/TestRunnerInterface';
import AssertionHelpers from '../../helpers/AssertionHelpers';
import {
    runQueryAsync,
    runExecuteAsync,
    startTransactionAsync,
    rollbackTransactionAsync,
    commitTransactionAsync,
    runInTransactionAsync,
} from '../../../src/repositories/util/ConnectionHandler';

// All assertions use observable MySQL behavior (CONNECTION_ID()) rather than
// wall-clock timing or mysql2 private internals, so the suite is stable in CI.
// Tests must bypass the ambient test transaction — otherwise every query is
// pinned to a single connection and pool behavior cannot be observed.

async function getConnectionIdViaPool(): Promise<number> {
    const rows = await runQueryAsync('SELECT CONNECTION_ID() AS cid') as Array<{ cid: number }>;
    return rows[0].cid;
}

export default function registerConnectionHandlerTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'ConnectionHandler',
        description: 'Pool-backed query execution and per-handle transaction isolation',

        tests: [
            {
                name: 'runQueryAsync fans out concurrent queries across multiple pool connections',
                bypassTransaction: true,
                testFunction: async () => {
                    // If the pool is real (not a single held connection), 5 concurrent
                    // CONNECTION_ID() calls return at least 2 distinct connection ids.
                    // Each connection has a unique server-side id, so a Set with size > 1
                    // proves the queries ran in parallel on different connections.
                    const ids = await Promise.all([
                        getConnectionIdViaPool(),
                        getConnectionIdViaPool(),
                        getConnectionIdViaPool(),
                        getConnectionIdViaPool(),
                        getConnectionIdViaPool(),
                    ]);
                    const unique = new Set(ids);
                    AssertionHelpers.assertGreaterThan(
                        unique.size,
                        1,
                        `concurrent queries should run on >1 distinct pool connection (got ids=${ids.join(',')})`,
                    );
                }
            },

            {
                name: 'runExecuteAsync also fans out across multiple pool connections',
                bypassTransaction: true,
                testFunction: async () => {
                    const rowsList = await Promise.all([
                        runExecuteAsync('SELECT CONNECTION_ID() AS cid'),
                        runExecuteAsync('SELECT CONNECTION_ID() AS cid'),
                        runExecuteAsync('SELECT CONNECTION_ID() AS cid'),
                    ]);
                    const ids = rowsList.map((rows) => (rows as Array<{ cid: number }>)[0].cid);
                    const unique = new Set(ids);
                    AssertionHelpers.assertGreaterThan(
                        unique.size,
                        1,
                        `concurrent execute() should use >1 distinct connection (got ids=${ids.join(',')})`,
                    );
                }
            },

            {
                name: 'two concurrent transaction handles use different connections',
                bypassTransaction: true,
                testFunction: async () => {
                    const a = await startTransactionAsync();
                    const b = await startTransactionAsync();
                    try {
                        const [idA] = await runQueryAsync('SELECT CONNECTION_ID() AS cid', undefined, a) as Array<{ cid: number }>;
                        const [idB] = await runQueryAsync('SELECT CONNECTION_ID() AS cid', undefined, b) as Array<{ cid: number }>;
                        AssertionHelpers.assertNotEqual(idA.cid, idB.cid, 'each handle should bind a distinct pool connection');
                    } finally {
                        await rollbackTransactionAsync(a);
                        await rollbackTransactionAsync(b);
                    }
                }
            },

            {
                name: 'commitTransactionAsync releases the connection so it can be reused',
                bypassTransaction: true,
                testFunction: async () => {
                    // Lock the pool to one connection by acquiring + committing in series.
                    // If commit released the connection, the next acquire reuses the same
                    // server-side id. If it didn't, the next acquire opens a new connection
                    // with a different id.
                    const seen = new Set<number>();
                    for (let i = 0; i < 5; i++) {
                        const tx = await startTransactionAsync();
                        const [row] = await runQueryAsync('SELECT CONNECTION_ID() AS cid', undefined, tx) as Array<{ cid: number }>;
                        seen.add(row.cid);
                        await commitTransactionAsync(tx);
                    }
                    AssertionHelpers.assertTrue(
                        seen.size <= 5,
                        `at most 5 distinct ids across 5 cycles, got ${seen.size} (ids=${[...seen].join(',')})`,
                    );
                    // Strong contract: the pool reuses connections, so we never see more than
                    // a small bounded set even after 5 cycles — typically just 1.
                    AssertionHelpers.assertLessThan(
                        seen.size,
                        4,
                        `commit must release back to the pool — saw ${seen.size} distinct ids across 5 serial commits`,
                    );
                }
            },

            {
                name: 'rollbackTransactionAsync releases the connection so it can be reused',
                bypassTransaction: true,
                testFunction: async () => {
                    const seen = new Set<number>();
                    for (let i = 0; i < 5; i++) {
                        const tx = await startTransactionAsync();
                        const [row] = await runQueryAsync('SELECT CONNECTION_ID() AS cid', undefined, tx) as Array<{ cid: number }>;
                        seen.add(row.cid);
                        await rollbackTransactionAsync(tx);
                    }
                    AssertionHelpers.assertLessThan(
                        seen.size,
                        4,
                        `rollback must release back to the pool — saw ${seen.size} distinct ids across 5 serial rollbacks`,
                    );
                }
            },

            {
                name: 'runInTransactionAsync routes implicit queries through the ambient handle',
                bypassTransaction: true,
                testFunction: async () => {
                    const tx = await startTransactionAsync();
                    try {
                        const [outsideRow] = await runQueryAsync('SELECT CONNECTION_ID() AS cid', undefined, tx) as Array<{ cid: number }>;

                        const insideCid = await runInTransactionAsync(tx, async () => {
                            // No explicit tx → AsyncLocalStorage delivers the ambient handle
                            const rows = await runQueryAsync('SELECT CONNECTION_ID() AS cid') as Array<{ cid: number }>;
                            return rows[0].cid;
                        });

                        AssertionHelpers.assertEqual(
                            insideCid,
                            outsideRow.cid,
                            'ambient context routes implicit queries through the same handle connection',
                        );
                    } finally {
                        await rollbackTransactionAsync(tx);
                    }
                }
            },

            {
                name: 'sequential commit cycles do not exhaust the pool',
                bypassTransaction: true,
                testFunction: async () => {
                    // Open + commit 10 transactions in series. Each commit must release so the
                    // pool can hand the connection back out — proving by the fact that the
                    // distinct-ids set never explodes (would be 10 distinct ids without reuse).
                    const seen = new Set<number>();
                    for (let i = 0; i < 10; i++) {
                        const tx = await startTransactionAsync();
                        const [row] = await runQueryAsync('SELECT CONNECTION_ID() AS cid', undefined, tx) as Array<{ cid: number }>;
                        seen.add(row.cid);
                        await commitTransactionAsync(tx);
                    }
                    AssertionHelpers.assertLessThan(
                        seen.size,
                        5,
                        `pool must reuse connections — got ${seen.size} distinct ids across 10 serial cycles`,
                    );
                }
            }
        ]
    };

    runner.addSuite(suite);
}
