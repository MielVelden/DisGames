import { Component } from "../../interfaces/application/Message";
import { GameTypeEnum } from "../../interfaces/enums";
import ComponentService from "../../services/application/ComponentService";
import GameService from "../../services/domain/GameService";
import { ServersModel } from "../../interfaces/database/TableInterfaces";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import { createTitle } from "../../utils/helpers/Markdown";

export async function createGameHelpContainerAsync(gameType: GameTypeEnum, server?: ServersModel): Promise<Component[]> {
    const gameImage = await GameService.getBannerAsync(gameType, server);
    const gameInfo = i18n.enums.gameTypes[gameType];

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
