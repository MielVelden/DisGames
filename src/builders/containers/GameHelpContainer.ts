import GameService from "../../services/domain/GameService";
import { GameTypeEnum } from "../../interfaces/enums";
import { Component, ComponentType, Container } from "../../interfaces/application/Message";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import MediaService from "../../services/application/MediaService";

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
