import { Interaction as DiscordInteraction, Message as DiscordMessage } from "discord.js";
import { MultiLingualString } from "../../../utils/i18n/MultiLingualString";
import { ReplyInteractionEvent } from "../../../interfaces/application/Event";
import { BaseDiscordEvent } from "./BaseDiscordEvent";
import DiscordMessageHandler from "../handlers/DiscordMessageHandler";

export abstract class BaseReplyDiscordEvent<TInteraction extends DiscordInteraction | DiscordMessage> extends BaseDiscordEvent<TInteraction> implements ReplyInteractionEvent {
    public async replyAsync(content?: MultiLingualString, ephemeral?: boolean): Promise<void> {
        await DiscordMessageHandler.replyAsync(this as any, content, ephemeral);
        this.flushPostSend();
    }
} 