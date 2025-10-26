import GameService from "../../services/domain/GameService";
import { GamesModel } from "../../interfaces/database/TableInterfaces";
import { ActionButton } from "../../interfaces/application/Message";
import { GameSettingsValues } from "../../interfaces/domain/GameSettings";
import { LanguageEnum } from "../../interfaces/enums";
import { Component, ComponentType, Container } from "../../interfaces/application/Message";
import { createMultiLingualString, MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import MediaService from "../../services/application/MediaService";

export function createGameContainer(
    game: GamesModel, 
    actions: ActionButton[], 
    settings?: GameSettingsValues,
    languageEnum: LanguageEnum = LanguageEnum.NL
): Component[] {
    const gameModule = GameService.getGameByType(game.GameTypeEnum);
    const gameImage = MediaService.getGameImage(game.GameTypeEnum);

    return [
        {
            type: ComponentType.CONTAINER,
            components: [
                {
                    type: ComponentType.MEDIA_GALLERY,
                    items: [
                        {
                            media: gameImage
                        }
                    ]
                },
            ]
        } as Container,
        {
            type: ComponentType.CONTAINER,
            components: [
                {
                    type: ComponentType.TEXT_DISPLAY,
                    content: gameModule?.config.description || new MultiLingualString(i18n.commands.games.settings.gameDescription)
                },
                {
                    type: ComponentType.TITLE,
                    content: createMultiLingualString(`Channel`)
                },
                {
                    type: ComponentType.TEXT_DISPLAY,
                    content: new MultiLingualString(i18n.commands.games.settings.currentChannel)
                },
                
                // Add game settings if available
                ...(gameModule?.config.settings && settings ? [
                    {
                        type: ComponentType.SEPARATOR,
                        divider: true,
                        spacing: 1
                    },
                    ...GameService.createSettingsDisplayComponents(
                        gameModule.config.settings,
                        settings,
                        languageEnum,
                        true
                    )
                ] : [])
            ]
        } as Container,
        ...actions
    ];
}