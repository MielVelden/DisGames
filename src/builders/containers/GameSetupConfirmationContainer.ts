import { Component, ComponentType, Container } from "../../interfaces/application/Message";
import { GameSettingsValues } from "../../interfaces/domain/GameSettings";
import { GameTypeEnum } from "../../interfaces/enums";
import { LanguageEnum } from "../../interfaces/enums";
import ComponentService from "../../services/application/ComponentService";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import GameService from "../../services/domain/GameService";
import { GameSettingsContainer } from "./GameSettingsContainer";

export function createGameSetupConfirmationContainer(
    gameName: string, 
    channelName: string, 
    gameTypeEnum?: GameTypeEnum,
    settings?: GameSettingsValues,
    languageEnum: LanguageEnum = LanguageEnum.NL
): Component {
    const baseContainer = ComponentService.createContainer({
        title: new MultiLingualString(i18n.commands.games.labels.confirmSetupTitle),
        description: i18n.commands.games.labels.confirmSetupDescription(gameName, channelName)
    });

    // If game has settings, add them to the confirmation
    if (gameTypeEnum && settings) {
        const gameModule = GameService.getGameByType(gameTypeEnum);
        if (gameModule?.config.settings) {
            const compactSettingsDisplay = GameSettingsContainer.createReadOnlyDisplay({
                settingsSchema: gameModule.config.settings,
                settings: settings,
                languageEnum: languageEnum
            });
            
            // Combine both containers
            return {
                type: ComponentType.CONTAINER,
                components: [
                    ...baseContainer.components,
                    {
                        type: ComponentType.SEPARATOR,
                        divider: true,
                        spacing: 1
                    },
                    ...compactSettingsDisplay
                ]
            } as Container;
        }
    }

    return baseContainer;
}