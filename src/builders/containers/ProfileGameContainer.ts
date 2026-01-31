import { Component, ComponentType, Container } from "../../interfaces/application/Message";
import { ProfileGameView } from "../../interfaces/view";
import MediaService from "../../services/application/MediaService";
import { createInformationBlock } from "../../utils/helpers/Markdown";
import { i18n } from "../../utils/i18n/i18n";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";

export function createProfileGameContainer(gameProfile: ProfileGameView): Component {
    const gameImage = MediaService.getGameImage(gameProfile.gameType);
    const gameInfo = i18n.commands.games.types[gameProfile.gameType];

    return {
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
            {
                type: ComponentType.TITLE,
                content: new MultiLingualString(gameInfo.name)
            },
            {
                type: ComponentType.TEXT_DISPLAY,
                content: new MultiLingualString(gameInfo.description)
            },
            {
                type: ComponentType.TEXT_DISPLAY,
                content: createGameProfileText(gameProfile)
            }
        ]
    } as Container
}

function createGameProfileText(gameProfile: ProfileGameView): MultiLingualString {
    if(gameProfile.gamePoints === 0)
        return new MultiLingualString(i18n.commands.profile.labels.notRanked);

    const items: { key: MultiLingualString; value: string }[] = [];
    if (gameProfile.username !== undefined)
        items.push({ key: new MultiLingualString(i18n.commands.profile.labels.username), value: gameProfile.username });
    items.push(
        { key: new MultiLingualString(i18n.tables.points.multiName), value: gameProfile.gamePoints.toString() },
        { key: new MultiLingualString(i18n.commands.profile.labels.position), value: gameProfile.gameRank.toString() + " / " + gameProfile.gameRankPlayerCount.toString() },
    );
    return createInformationBlock(items);
}