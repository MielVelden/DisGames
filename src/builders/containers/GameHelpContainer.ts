import { Component } from "../../interfaces/application/Message";
import { GameTypeEnum } from "../../interfaces/enums";
import ComponentService from "../../services/application/ComponentService";
import MediaService from "../../services/application/MediaService";
import GameService from "../../services/domain/GameService";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import { createTitle } from "../../utils/helpers/Markdown";

export function createGameHelpContainer(gameType: GameTypeEnum): Component[] {
    GameService.getGameByType(gameType);
    const gameImage = MediaService.getGameImage(gameType);
    const gameInfo = i18n.commands.games.types[gameType];

    return [
        ComponentService.createImage(gameImage, false),
        ComponentService.createSeparator(),
        ComponentService.createContent(createTitle(new MultiLingualString(gameInfo.name))),
        ComponentService.createContent(new MultiLingualString(gameInfo.longDescription)),
        ComponentService.createSeparator(),
        ComponentService.createContent(createTitle(new MultiLingualString(i18n.commands.games.labels.howToPlay))),
        ComponentService.createContent(new MultiLingualString(gameInfo.howToPlay)),
    ];
}
