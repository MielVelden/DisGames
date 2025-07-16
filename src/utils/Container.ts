import { ActionButton, ButtonStyle, Component, ComponentType, Container } from "../interfaces/application/Message";
import { GamesModel } from "../interfaces/database";
import MediaService from "../services/MediaService";
import { i18n } from "./i18n/i18n";
import { createMultiLingualString, MultiLingualString } from "./i18n/MultiLangualString";
import GameService from "../services/GameService";
import ComponentService from "../services/ComponentService";
import { createTitle } from "./Markdown";

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
                    content: createMultiLingualString('Test your word skills with scrambled letter puzzles')
                },
                {
                    type: ComponentType.TITLE,
                    content: createMultiLingualString(`Channel`)
                },
                {
                    type: ComponentType.TEXT_DISPLAY,
                    content: createMultiLingualString(`Select the channel you want to use for this game.`)
                },
                ComponentService.createButton({
                    style: ButtonStyle.SECONDARY,
                    label: createMultiLingualString('Gamechannel-5'),
                }),
                {
                    type: ComponentType.SEPARATOR,
                    divider: true,
                    spacing: 1
                },
                // Difficulty
                {
                    type: ComponentType.TITLE,
                    content: createMultiLingualString(`Difficulty`)
                },
                {
                    type: ComponentType.TEXT_DISPLAY,
                    content: createMultiLingualString(`Select a difficulty level for this game.`)
                },
                ComponentService.createButton({
                    style: ButtonStyle.SECONDARY,
                    label: createMultiLingualString('Easy'),
                }),
                ComponentService.createButton({
                    style: ButtonStyle.SUCCESS,
                    label: createMultiLingualString('Medium'),
                }),
                ComponentService.createButton({
                    style: ButtonStyle.SECONDARY,
                    label: createMultiLingualString('Hard'),
                }),
                {
                    type: ComponentType.SEPARATOR,
                    divider: true,
                    spacing: 1
                },
                {
                    type: ComponentType.TITLE,
                    content: createMultiLingualString(`Datasheets`)
                },
                {
                    type: ComponentType.TEXT_DISPLAY,
                    content: createMultiLingualString(`Quickly select the datasheets from the list below you want to use for this game.`)
                },
                ComponentService.createButton({
                    style: ButtonStyle.SECONDARY,
                    label: createMultiLingualString('General'),
                }),
                ComponentService.createButton({
                    style: ButtonStyle.SECONDARY,
                    label: createMultiLingualString('Holidays'),
                }),
                ComponentService.createButton({
                    style: ButtonStyle.SECONDARY,
                    label: createMultiLingualString('Popular Movies'),
                }),
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