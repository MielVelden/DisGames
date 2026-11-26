import { Component } from "../../interfaces/application/Message";
import { ProfileGameResponse } from "../../interfaces/view";
import ComponentService from "../../services/application/ComponentService";
import GameService from "../../services/domain/GameService";
import { ServersModel } from "../../interfaces/database/TableInterfaces";
import { createBlock, createInformationBlock, createTitle } from "../../utils/helpers/Markdown";
import { i18n } from "../../utils/i18n/i18n";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";

export async function createProfileGameContainerAsync(gameProfile: ProfileGameResponse, server?: ServersModel): Promise<Component[]> {
    const gameImage = await GameService.getBannerAsync(gameProfile.gameType, server);
    const gameInfo = i18n.enums.gameTypes[gameProfile.gameType];

    return [
        ComponentService.createImage(gameImage, false),
        ComponentService.createContent(createTitle(new MultiLingualString(gameInfo.name))),
        ComponentService.createContent(new MultiLingualString(gameInfo.description)),
        ComponentService.createContent(createGameProfileText(gameProfile)),
    ];
}

function createGameProfileText(gameProfile: ProfileGameResponse): MultiLingualString {
    if (gameProfile.gamePoints === 0)
        return createBlock(new MultiLingualString(i18n.commands.profile.labels.notRanked));

    const items: { key: MultiLingualString; value: string }[] = [];
    if (gameProfile.username !== undefined)
        items.push({ key: new MultiLingualString(i18n.commands.profile.labels.username), value: gameProfile.username });
    items.push(
        { key: new MultiLingualString(i18n.tables.points.multiName), value: gameProfile.gamePoints.toString() },
        { key: new MultiLingualString(i18n.commands.profile.labels.position), value: gameProfile.gameRank.toString() + " / " + gameProfile.gameRankPlayerCount.toString() },
    );
    return createInformationBlock(items);
}
