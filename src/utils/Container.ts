import { ActionButton, ButtonStyle, Component, ComponentType, Container } from "../interfaces/application/Message";
import { GamesModel } from "../interfaces/database";
import { GameTypeEnum, LanguageEnum } from "../interfaces/enums";
import MediaService from "../services/MediaService";
import { i18n } from "./i18n/i18n";
import { createMultiLingualString, MultiLingualString } from "./i18n/MultiLangualString";
import GameService from "../services/GameService";
import ComponentService from "../services/ComponentService";
import { GameSettingsValues } from "../interfaces/domain/GameSettings";
import { GameSettingsContainer } from "./GameSettingsContainer";

export function createGameHelpContainer(gameType: GameTypeEnum): Component[] {
    const gameModule = GameService.getGameByType(gameType);
    const gameImage = MediaService.getGameImage(gameType);
    const gameInfo = i18n.commands.games.types[gameType];

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
                    type: ComponentType.TITLE,
                    content: new MultiLingualString(gameInfo.name)
                },
                {
                    type: ComponentType.TEXT_DISPLAY,
                    content: new MultiLingualString(gameInfo.longDescription)
                },
                {
                    type: ComponentType.SEPARATOR,
                    divider: true,
                    spacing: 1
                },
                {
                    type: ComponentType.TITLE,
                    content: new MultiLingualString(i18n.commands.games.labels.howToPlay)
                },
                {
                    type: ComponentType.TEXT_DISPLAY,
                    content: new MultiLingualString(gameInfo.howToPlay)
                },
            ]
        } as Container
    ];
}

export function createActiveGameContainer(
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

export function createGameSettingsContainer(
    gameTypeEnum: GameTypeEnum,
    currentSettings: GameSettingsValues,
    languageEnum: LanguageEnum = LanguageEnum.NL
): Container | null {
    const gameModule = GameService.getGameByType(gameTypeEnum);
    
    if (!gameModule?.config.settings) {
        return null;
    }

    const settingsComponents = GameService.createSettingsDisplayComponents(
        gameModule.config.settings,
        currentSettings,
        languageEnum,
        false
    );

    return {
        type: ComponentType.CONTAINER,
        components: [
            {
                type: ComponentType.TITLE,
                content: new MultiLingualString(i18n.commands.games.settings.title)
            },
            {
                type: ComponentType.TEXT_DISPLAY,
                content: new MultiLingualString(i18n.commands.games.settings.description)
            },
            {
                type: ComponentType.SEPARATOR,
                divider: true,
                spacing: 1
            },
            ...settingsComponents
        ]
    } as Container;
}