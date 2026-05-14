import TestRunner from '../../TestRunner';
import { TestSuite } from '../../interfaces/TestRunnerInterface';
import GameService from '../../../src/services/domain/GameService';
import GameDataRepository from '../../../src/repositories/GameDataRepository';
import MediaService from '../../../src/services/application/MediaService';
import AssertionHelpers from '../../helpers/AssertionHelpers';

export default function registerMediaServiceTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'MediaService',
        description: 'Unit tests for MediaService functionality',

        setup: async () => {},
        teardown: async () => {},
        beforeEach: async () => {},
        afterEach: async () => {},

        tests: [
            {
                name: 'getGameDataImage should return a valid image for the highest GameData id of a game with images',
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
            }
        ]
    };

    runner.addSuite(suite);
}
