import { ActionButton, ButtonStyle, Component, ComponentType, Container } from "../interfaces/application/Message";
import { GamesModel } from "../interfaces/database";
import MediaService from "../services/MediaService";
import { i18n } from "./i18n/i18n";
import { createMultiLingualString, MultiLingualString } from "./i18n/MultiLangualString";
import GameService from "../services/GameService";
import ComponentService from "../services/ComponentService";

export function createActiveGameContainer(game: GamesModel, actions: ActionButton[]): Component[] {
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
                    content: createMultiLingualString('Test your word skills with scrambled letter puzzles\n**Channel:** `gamechannel-5`')
                },
                {
                    type: ComponentType.SEPARATOR,
                    divider: true,
                    spacing: 1
                },
                // Difficulty
                {
                    type: ComponentType.TITLE,
                    content: createMultiLingualString('Difficulty')
                },
                ComponentService.createButton({
                    style: ButtonStyle.SUCCESS,
                    label: createMultiLingualString('⭐'),
                }),
                ComponentService.createButton({
                    style: ButtonStyle.SUCCESS,
                    label: createMultiLingualString('⭐'),
                }),
                ComponentService.createButton({
                    style: ButtonStyle.SECONDARY,
                    label: createMultiLingualString('⭐'),
                }),
                // Datasheets
                // {
                //     type: ComponentType.TITLE,
                //     content: createMultiLingualString('Datasheets')
                // },
                // ComponentService.createButton({
                //     style: ButtonStyle.SECONDARY,
                //     label: createMultiLingualString('General'),
                // }),
                // ComponentService.createButton({
                //     style: ButtonStyle.SECONDARY,
                //     label: createMultiLingualString('Holidays'),
                // }),
                // ComponentService.createButton({
                //     style: ButtonStyle.SECONDARY,
                //     label: createMultiLingualString('Popular Movies'),
                // }),
                // {
                //     type: ComponentType.SEPARATOR,
                //     divider: true,
                //     spacing: 1
                // },
                
            ]
        } as Container,
        ...actions
    ];
}