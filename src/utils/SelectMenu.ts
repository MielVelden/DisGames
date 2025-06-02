import { ComponentType, SelectMenu } from "../interfaces/application/Message";
import { GameModule } from "../interfaces/domain/Game";
import ComponentService from "../services/ComponentService";
import { i18n } from "./i18n/i18n";
import { MultiLingualString } from "./i18n/MultiLangualString";

export function createGamesSelectMenu(gameModules: GameModule[]): SelectMenu {
    return ComponentService.createSelectMenu({
        custom_id: "game",
        type: ComponentType.STRING_SELECT,
        placeholder: new MultiLingualString(i18n.commands.games.labels.selectGame),
        options: gameModules.map(game => ({
            label: game.config.name,
            emoji: game.config.emoji,
            description: game.config.description,
            value: game.config.id.toString()
        }))
    });
}