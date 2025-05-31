import { ComponentType, SelectMenu } from "../interfaces/application/Message";
import { GameModule } from "../interfaces/domain/Game";
import ComponentService from "../services/ComponentService";

export function createGamesSelectMenu(gameModules: GameModule[]): SelectMenu {
    return ComponentService.createSelectMenu({
        custom_id: "game",
        type: ComponentType.STRING_SELECT,
        placeholder: "Select a game",
        options: gameModules.map(game => ({
            label: game.config.name,
            value: game.config.id.toString()
        }))
    });
}