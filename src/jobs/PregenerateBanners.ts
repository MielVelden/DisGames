import { JobModule } from "../interfaces/application/Job";
import BannerService from "../services/domain/BannerService";
import GameService from "../services/domain/GameService";
import { i18n } from "../utils/i18n/i18n";

export default {
    id: 'pregenerate-banners',
    name: 'Pregenerate Banners',
    description: 'Renders every game and header banner for every language and style, so none are rendered on demand. Existing files are skipped.',
    isEnabled: true,
    cronExpression: '0 0 4 * * *',

    handler: async (progress): Promise<void> => {
        const contents = GameService.getGames().map(game => {
            const info = i18n.enums.gameTypes[game.config.id];
            return { key: `game-${game.config.id}`, emoji: game.config.emoji, title: info.name, description: info.description };
        });

        await BannerService.pregenerateAllAsync(contents, progress);
    },
} as JobModule;
