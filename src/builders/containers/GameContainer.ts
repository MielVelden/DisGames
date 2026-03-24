import GameService from "../../services/domain/GameService";
import { GamesModel } from "../../interfaces/database/TableInterfaces";
import { ActionButton } from "../../interfaces/application/Message";
import { GameSettingsValues } from "../../interfaces/domain/GameSettings";
import { ExceptionEnum, LanguageEnum } from "../../interfaces/enums";
import { Component } from "../../interfaces/application/Message";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import MediaService from "../../services/application/MediaService";
import ComponentService from "../../services/application/ComponentService";
import { createTitle } from "../../utils/helpers/Markdown";
import { GameSettingsContainer } from "./GameSettingsContainer";
import { ErrorHelper } from "../../utils/application/Error";

export async function createGameContainerAsync(
    game: GamesModel, 
    actions: ActionButton[], 
    settings?: GameSettingsValues,
    languageEnum: LanguageEnum = LanguageEnum.NL
): Promise<Component[]> {
    const gameModule = await GameService.getGameByTypeAsync(game.GameTypeEnum);
    if (!gameModule || !gameModule.config)
        ErrorHelper.throw(ExceptionEnum.GAME_MODULE_NOT_FOUND);
    const gameImage = MediaService.getGameImage(game.GameTypeEnum);
    const gameName = i18n.commands.games.labels.gameName(gameModule.config.name.getMessage(languageEnum));
    const gameDescription = gameModule.config.description || new MultiLingualString(i18n.commands.games.settings.gameDescription);
    const gameChannel = i18n.commands.games.labels.channelName(game.ChannelId);

    return [
        ComponentService.createImage(gameImage, false),
        ComponentService.createSeparator(),
        ComponentService.createContent(createTitle(gameModule.config.name)),
        ComponentService.createContent(gameDescription),
        ComponentService.createContent([gameName, gameChannel]),
        ...(gameModule.config.settings && settings ? [
            ...GameSettingsContainer.createReadOnlyDisplay({
                settingsSchema: gameModule.config.settings,
                settings: settings,
                languageEnum: languageEnum
            })
        ] : []),
        ComponentService.createSeparator(),
        ...actions
    ];
}