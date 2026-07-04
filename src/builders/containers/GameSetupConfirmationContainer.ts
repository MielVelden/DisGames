import { Component } from "../../interfaces/application/Message";
import { GameSettingsValues } from "../../interfaces/domain/GameSettings";
import { GameTypeEnum } from "../../interfaces/enums";
import { LanguageEnum } from "../../interfaces/enums";
import ComponentService from "../../services/application/ComponentService";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import GameService from "../../services/domain/GameService";
import { createGameSettingsDisplay } from "./GameSettingsContainer";
import MediaService from "../../services/application/MediaService";
import { createTitle } from "../../utils/helpers/Markdown";

export async function createGameSetupConfirmationContainerAsync(
    gameName: string, 
    channelName: string, 
    gameTypeEnum: GameTypeEnum,
    settings?: GameSettingsValues,
    languageEnum: LanguageEnum = LanguageEnum.NL
): Promise<Component[]> {
    const gameImage = MediaService.getGameImage(gameTypeEnum);

    const components: Component[] = [
        ComponentService.createImage(gameImage, false),
        ComponentService.createSeparator(),
        ComponentService.createContent(createTitle(new MultiLingualString(i18n.commands.games.settings.confirm.title))),
        ComponentService.createContent(new MultiLingualString(i18n.commands.games.settings.confirm.description)),
        ComponentService.createContent([i18n.commands.games.labels.gameName(gameName), i18n.commands.games.labels.channelName(channelName)]),
    ];

    // If game has settings, add them to the confirmation
    if (gameTypeEnum && settings) {
        const gameModule = await GameService.getGameByTypeAsync(gameTypeEnum);
        if (gameModule?.config.settings) {
            const compactSettingsDisplay = createGameSettingsDisplay({
                settingsSchema: gameModule.config.settings,
                settings: settings,
                languageEnum: languageEnum
            });
            
            // Combine both containers
            components.push(...compactSettingsDisplay);
        }
    }

    return [
        ...components,
        ComponentService.createSeparator()
    ];
}