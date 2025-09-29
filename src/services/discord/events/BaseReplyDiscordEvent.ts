import { MultiLingualString } from "../../../utils/i18n/MultiLingualString";
import { ReplyInteractionEvent } from "../../../interfaces/application/Event";
import { BaseDiscordEvent } from "./BaseDiscordEvent";
import DiscordMessageHandler from "../handlers/DiscordMessageHandler";

export abstract class BaseReplyDiscordEvent extends BaseDiscordEvent implements ReplyInteractionEvent {
    public async replyAsync(content?: MultiLingualString): Promise<void> {
        await DiscordMessageHandler.replyAsync(this, content);
    }
} 