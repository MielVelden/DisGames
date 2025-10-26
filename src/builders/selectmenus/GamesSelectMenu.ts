import { ComponentType, SelectMenu } from "../../interfaces/application/Message";
import ComponentService from "../../services/application/ComponentService";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import { GameModule } from "../../interfaces/domain/Game";

export function createGamesSelectMenu(gameModules: GameModule[]): SelectMenu {
    return ComponentService.createSelectMenu({
        custom_id: "game",
        type: ComponentType.STRING_SELECT,
        question: new MultiLingualString(i18n.commands.games.labels.selectGame),
        placeholder: new MultiLingualString(i18n.commands.games.labels.selectGame),
        options: gameModules.map(game => ({
            label: game.config.name,
            emoji: game.config.emoji,
            description: game.config.description,
            value: game.config.id.toString()
        }))
    });
}