import { ComponentType, Container } from "../interfaces/application/Message";
import { GamesModel } from "../interfaces/database";
import MediaService from "../services/MediaService";
import { i18n } from "./i18n/i18n";
import { createMultiLingualString, MultiLingualString } from "./i18n/MultiLangualString";
import GameService from "../services/GameService";

export function createActiveGameContainer(game: GamesModel): Container[] {
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
                    content: createMultiLingualString('Test your word skills with scrambled letter puzzles\n\n**Difficulty:** `★★★`\n**Channel:** `gamechannel-5`\n\n**Active Datasheets**\n`General` `Holidays` `Popular Movies`')
                }
            ]
        } as Container
    ];
}