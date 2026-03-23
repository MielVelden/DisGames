import { ComponentType, SelectMenu } from "../../interfaces/application/Message";
import ComponentService from "../../services/application/ComponentService";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";

export function createChannelSelectMenu(): SelectMenu {
    return ComponentService.createSelectMenu({
        custom_id: "move-to-channel",
        type: ComponentType.CHANNEL_SELECT,
        description: new MultiLingualString(i18n.commands.games.labels.chooseChannel),
        placeholder: new MultiLingualString(i18n.commands.games.labels.chooseChannel),
    });
}