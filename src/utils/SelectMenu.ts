import { ComponentType, SelectMenu } from "../interfaces/application/Message";
import { GameModule } from "../interfaces/domain/Game";
import ComponentService from "../services/application/ComponentService";
import { i18n } from "./i18n/i18n";
import { MultiLingualString } from "./i18n/MultiLingualString";

export function isSelectMenuEmpty(selectMenu: SelectMenu): boolean {
    switch(selectMenu.type) {
        case ComponentType.STRING_SELECT:
            return selectMenu.options.length === 0;
        default:
            return false;
    }
}

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

export function createChannelSelectMenu(): SelectMenu {
    return ComponentService.createSelectMenu({
        custom_id: "move-to-channel",
        type: ComponentType.CHANNEL_SELECT,
        question: new MultiLingualString(i18n.commands.games.labels.chooseChannel),
        placeholder: new MultiLingualString(i18n.commands.games.labels.chooseChannel),
    });
}