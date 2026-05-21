import * as fs from 'fs';
import * as path from 'path';
import TestRunner from '../../TestRunner';
import { TestSuite } from '../../interfaces/TestRunnerInterface';
import GameService from '../../../src/services/domain/GameService';
import GameDataRepository from '../../../src/repositories/GameDataRepository';
import MediaService from '../../../src/services/application/MediaService';
import { MediaType } from '../../../src/interfaces/application/Media';
import AssertionHelpers from '../../helpers/AssertionHelpers';

export default function registerMediaServiceTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'MediaService',
        description: 'Unit tests for MediaService functionality',

        tests: [
            {
                name: 'getGameDataImage should return a valid image for the highest GameData id of a game with images',
                skip: true, // Skipping this test for now since it relies on existing data and media files which may not be present in all environments
                testFunction: async () => {
                    // Arrange — find all games that have images
                    const gamesWithImages = GameService.getGames().filter(g => g.config.hasImages === true);
                    AssertionHelpers.assertGreaterThan(gamesWithImages.length, 0, 'There should be at least one game with hasImages');

                    for (const gameModule of gamesWithImages) {
                        const gameId = gameModule.config.id;

                        const gameDataRows = await GameDataRepository.baseRepository
                            .Select()
                            .Where({ GameId: gameId })
                            .OrderBy('Id', 'DESC')
                            .Limit(1)
                            .Execute();

                        AssertionHelpers.assertGreaterThan(
                            gameDataRows.length,
                            0,
                            `Game ${gameId} with hasImages should have at least one GameData row`
                        );

                        const gameDataId = gameDataRows[0].Id;

                        // Act
                        const result = MediaService.getGameDataImage(gameId, gameDataId);

                        // Assert — result must not be the NotFound fallback
                        AssertionHelpers.assertNotNull(result, 'getGameDataImage should return a Media object');
                        AssertionHelpers.assertNotEqual(result.name, 'NotFound', `Image for game ${gameId} / data ${gameDataId} should exist`);
                    }
                }
            },

            {
                name: 'getMediaBufferAsync hits cache on second call',
                testFunction: async () => {
                    MediaService._clearBufferCacheForTests();

                    const image = { url: '', name: 'profile', type: MediaType.PNG };
                    const expectedPath = path.join(process.cwd(), 'images', `profile.${MediaType.PNG}`);

                    // First call → reads from disk and caches
                    const first = await MediaService.getMediaBufferAsync(image);
                    AssertionHelpers.assertNotNull(first, 'first read returned a buffer');
                    AssertionHelpers.assertGreaterThan(first.length, 0, 'buffer non-empty');

                    // Spy on fs.promises.readFile after the first read populated the cache
                    const original = fs.promises.readFile;
                    let readFileCalls = 0;
                    (fs.promises as any).readFile = ((...args: any[]) => {
                        readFileCalls++;
                        return (original as any).apply(fs.promises, args);
                    }) as typeof fs.promises.readFile;

                    try {
                        const second = await MediaService.getMediaBufferAsync(image);
                        AssertionHelpers.assertEqual(second.length, first.length, 'same buffer length on cache hit');
                        AssertionHelpers.assertEqual(readFileCalls, 0, 'cache hit must not call fs.promises.readFile');
                        AssertionHelpers.assertTrue(expectedPath.length > 0, 'expected path resolved');
                    } finally {
                        (fs.promises as any).readFile = original;
                    }
                }
            },

            {
                name: 'initAsync preloads base images so subsequent reads skip disk',
                testFunction: async () => {
                    MediaService._clearBufferCacheForTests();
                    await MediaService.initAsync();

                    const original = fs.promises.readFile;
                    let readFileCalls = 0;
                    (fs.promises as any).readFile = ((...args: any[]) => {
                        readFileCalls++;
                        return (original as any).apply(fs.promises, args);
                    }) as typeof fs.promises.readFile;

                    try {
                        for (const name of ['welcome', 'profile', 'aboutme', 'settings'] as const) {
                            const img = { url: '', name, type: MediaType.PNG };
                            const buf = await MediaService.getMediaBufferAsync(img);
                            AssertionHelpers.assertGreaterThan(buf.length, 0, `${name} buffer non-empty`);
                        }
                        AssertionHelpers.assertEqual(readFileCalls, 0, 'preloaded base images should not re-read from disk');
                    } finally {
                        (fs.promises as any).readFile = original;
                    }
                }
            },

            {
                name: 'getMediaBufferAsync falls back to NotFound when image missing',
                testFunction: async () => {
                    MediaService._clearBufferCacheForTests();
                    await MediaService.initAsync(); // populate NotFound in cache

                    const missing = { url: '', name: 'definitely-not-a-real-image-xyz', type: MediaType.PNG };
                    const buf = await MediaService.getMediaBufferAsync(missing);

                    AssertionHelpers.assertNotNull(buf, 'fallback buffer returned');
                    AssertionHelpers.assertGreaterThan(buf.length, 0, 'fallback buffer non-empty');

                    // It should match the NotFound buffer specifically
                    const notFoundBuf = await MediaService.getBufferByPathAsync(
                        path.join(process.cwd(), 'images', `NotFound.${MediaType.PNG}`),
                    );
                    AssertionHelpers.assertEqual(buf.length, notFoundBuf.length, 'fallback buffer matches NotFound size');
                }
            },

            {
                name: 'fileExistsAsync uses cache hit as fast positive answer',
                testFunction: async () => {
                    MediaService._clearBufferCacheForTests();
                    await MediaService.initAsync();

                    const original = fs.promises.access;
                    let accessCalls = 0;
                    (fs.promises as any).access = ((...args: any[]) => {
                        accessCalls++;
                        return (original as any).apply(fs.promises, args);
                    }) as typeof fs.promises.access;

                    try {
                        const cachedPath = path.join(process.cwd(), 'images', `profile.${MediaType.PNG}`);
                        const exists = await MediaService.fileExistsAsync(cachedPath);
                        AssertionHelpers.assertTrue(exists, 'cached path reports exists');
                        AssertionHelpers.assertEqual(accessCalls, 0, 'cached existence check skips fs.access');
                    } finally {
                        (fs.promises as any).access = original;
                    }
                }
            }
        ]
    };

    runner.addSuite(suite);
}
