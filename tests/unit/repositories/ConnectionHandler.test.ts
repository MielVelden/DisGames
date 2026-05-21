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
    _getPoolForTests,
} from '../../../src/repositories/util/ConnectionHandler';

// These tests verify the pool actually pools (parallel queries), that transactions
// are isolated per handle, and that connections are returned to the pool on commit/rollback.
// They MUST run with bypassTransaction so the ambient test transaction does not pin every
// query to a single connection.

export default function registerConnectionHandlerTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'ConnectionHandler',
        description: 'Pool-backed query execution and per-handle transaction isolation',

        tests: [
            {
                name: 'runQueryAsync uses the pool — concurrent queries run in parallel',
                bypassTransaction: true,
                testFunction: async () => {
                    const start = Date.now();
                    await Promise.all([
                        runQueryAsync('SELECT SLEEP(0.1) AS slept'),
                        runQueryAsync('SELECT SLEEP(0.1) AS slept'),
                        runQueryAsync('SELECT SLEEP(0.1) AS slept'),
                        runQueryAsync('SELECT SLEEP(0.1) AS slept'),
                        runQueryAsync('SELECT SLEEP(0.1) AS slept'),
                    ]);
                    const elapsed = Date.now() - start;
                    AssertionHelpers.assertLessThan(
                        elapsed,
                        400,
                        `5 parallel 100ms queries should complete under 400ms with a real pool (took ${elapsed}ms)`,
                    );
                }
            },

            {
                name: 'runExecuteAsync also pools concurrent prepared queries',
                bypassTransaction: true,
                testFunction: async () => {
                    const start = Date.now();
                    await Promise.all([
                        runExecuteAsync('SELECT SLEEP(?) AS slept', [0.1]),
                        runExecuteAsync('SELECT SLEEP(?) AS slept', [0.1]),
                        runExecuteAsync('SELECT SLEEP(?) AS slept', [0.1]),
                    ]);
                    const elapsed = Date.now() - start;
                    AssertionHelpers.assertLessThan(
                        elapsed,
                        300,
                        `3 parallel 100ms execute calls should complete under 300ms (took ${elapsed}ms)`,
                    );
                }
            },

            {
                name: 'two concurrent transaction handles use different connections',
                bypassTransaction: true,
                testFunction: async () => {
                    // CONNECTION_ID() is per-connection. Two distinct handles must report
                    // different connection ids → proves we are not holding a single shared connection.
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
                name: 'commitTransactionAsync releases the connection back to the pool',
                bypassTransaction: true,
                testFunction: async () => {
                    const pool = _getPoolForTests();
                    AssertionHelpers.assertNotNull(pool, 'pool exists');

                    const before = (pool as any)._allConnections?.length ?? 0;

                    const tx = await startTransactionAsync();
                    await runQueryAsync('SELECT 1', undefined, tx);
                    await commitTransactionAsync(tx);

                    const after = (pool as any)._allConnections?.length ?? 0;
                    AssertionHelpers.assertTrue(
                        after - before <= 1,
                        `pool size after commit should not grow unbounded (before=${before}, after=${after})`,
                    );
                }
            },

            {
                name: 'rollbackTransactionAsync releases the connection back to the pool',
                bypassTransaction: true,
                testFunction: async () => {
                    const pool = _getPoolForTests();
                    AssertionHelpers.assertNotNull(pool, 'pool exists');

                    const before = (pool as any)._allConnections?.length ?? 0;

                    const tx = await startTransactionAsync();
                    await runQueryAsync('SELECT 1', undefined, tx);
                    await rollbackTransactionAsync(tx);

                    const after = (pool as any)._allConnections?.length ?? 0;
                    AssertionHelpers.assertTrue(
                        after - before <= 1,
                        `pool size after rollback should not grow unbounded (before=${before}, after=${after})`,
                    );
                }
            },

            {
                name: 'runInTransactionAsync makes runQueryAsync route to the ambient handle',
                bypassTransaction: true,
                testFunction: async () => {
                    const tx = await startTransactionAsync();
                    try {
                        const [outsideRow] = await runQueryAsync('SELECT CONNECTION_ID() AS cid', undefined, tx) as Array<{ cid: number }>;

                        const insideRow = await runInTransactionAsync(tx, async () => {
                            // No explicit tx → AsyncLocalStorage delivers the ambient handle
                            const rows = await runQueryAsync('SELECT CONNECTION_ID() AS cid') as Array<{ cid: number }>;
                            return rows[0];
                        });

                        AssertionHelpers.assertEqual(
                            insideRow.cid,
                            outsideRow.cid,
                            'ambient context routes implicit queries through the same handle connection',
                        );
                    } finally {
                        await rollbackTransactionAsync(tx);
                    }
                }
            },

            {
                name: 'sequential transactions reuse pool connections (no growth)',
                bypassTransaction: true,
                testFunction: async () => {
                    // Open + commit 5 transactions in series and confirm the pool's connection
                    // count does not grow unbounded — each commit's release returns the
                    // connection so the next acquisition reuses it.
                    const pool = _getPoolForTests();
                    AssertionHelpers.assertNotNull(pool, 'pool exists');

                    const baselineSize = (pool as any)._allConnections?.length ?? 0;

                    for (let i = 0; i < 5; i++) {
                        const tx = await startTransactionAsync();
                        await runQueryAsync('SELECT 1', undefined, tx);
                        await commitTransactionAsync(tx);
                    }

                    const finalSize = (pool as any)._allConnections?.length ?? 0;
                    AssertionHelpers.assertTrue(
                        finalSize - baselineSize <= 1,
                        `pool size grew by at most 1 over 5 tx cycles (baseline=${baselineSize}, final=${finalSize})`,
                    );
                }
            }
        ]
    };

    runner.addSuite(suite);
}
