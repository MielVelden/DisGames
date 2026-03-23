import { ComponentType, SelectMenu } from "../../interfaces/application/Message";
import ComponentService from "../../services/application/ComponentService";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import { GameModule } from "../../interfaces/domain/Game";
import GameService from "../../services/domain/GameService";
import { HandlerConfig } from "../../interfaces/application/Event";

export function createGamesSelectMenu(gameModules: GameModule[], handlerConfig?: HandlerConfig): SelectMenu {
    return ComponentService.createSelectMenu({
        custom_id: "game",
        type: ComponentType.STRING_SELECT,
        title: new MultiLingualString(i18n.commands.games.labels.selectGame.title),
        description: new MultiLingualString(i18n.commands.games.labels.selectGame.description),
        placeholder: new MultiLingualString(i18n.commands.games.labels.selectGame.description),
        options: gameModules.map(game => ({
            label: game.config.name,
            emoji: game.config.emoji,
            description: game.config.description,
            value: game.config.id.toString()
        }))
    }, handlerConfig);
}

export function createAllGamesSelectMenu(handlerConfig?: HandlerConfig): SelectMenu {
    return createGamesSelectMenu(GameService.getGames(), handlerConfig);
}