import { ChatInputCommandInteraction as DiscordChatInputCommandInteraction, GuildMember as DiscordGuildMember } from "discord.js";
import { MessageInteractionEvent } from "../../interfaces/application/Event";
import { CommandEnum } from "../../interfaces/enums/commands/CommandEnum";
import DiscordMemberService from "../../services/discord/DiscordMemberService";
import DiscordService from "../../services/discord/DiscordService";
import { handleDiscordInteractionAsync } from "../../events/interactionCreate";

export async function impersonateSlashCommandAsync(
    originalEvent: MessageInteractionEvent,
    targetUserId: string,
    commandName: CommandEnum,
    initialOptions?: Record<string, string | number | boolean>
): Promise<void> {
    const guild = originalEvent.currentInteraction.guild;
    if (!guild)
        return;

    const targetMember = await DiscordMemberService.fetchMemberAsync(guild, targetUserId);
    if (!targetMember)
        return;

    const originalMessage = originalEvent.currentInteraction;
    const channel = originalMessage.channel as any;
    
    let replied = false;
    let deferred = false;
    let replyMessage: any = null;
    
    const fakeOptions = {
        get: (name: string) => {
            if (initialOptions && name in initialOptions) {
                return {
                    value: initialOptions[name]
                };
            }
            return null;
        }
    };

    const fakeInteraction = new Proxy(originalMessage, {
        get(target, prop) {
            if (prop === 'user')
                return targetMember.user;

            if (prop === 'member')
                return targetMember;

            if (prop === 'commandName')
                return commandName.toString().toLowerCase();

            if (prop === 'options')
                return fakeOptions;

            if (prop === 'isChatInputCommand')
                return () => true;

            if (prop === 'isButton')
                return () => false;

            if (prop === 'isStringSelectMenu')
                return () => false;

            if (prop === 'isChannelSelectMenu')
                return () => false;

            if (prop === 'guild')
                return guild;

            if (prop === 'channelId')
                return originalEvent.channelId;

            if (prop === 'guildId')
                return originalEvent.guildId;

            if (prop === 'id')
                return originalEvent.messageId;

            if (prop === 'replied')
                return replied;

            if (prop === 'deferred')
                return deferred;

            if (prop === 'reply') {
                return async (content: any) => {
                    replied = true;
                    replyMessage = await channel.send(content);
                    return replyMessage;
                };
            }

            if (prop === 'editReply') {
                return async (content: any) => {
                    if (replyMessage) {
                        return await replyMessage.edit(content);
                    }
                    return await channel.send(content);
                };
            }

            if (prop === 'deferReply') {
                return async (options?: any) => {
                    deferred = true;
                    replied = true;
                    return Promise.resolve();
                };
            }

            if (prop === 'update') {
                return async (content: any) => {
                    if (replyMessage) {
                        return await replyMessage.edit(content);
                    }
                    replyMessage = await channel.send(content);
                    return replyMessage;
                };
            }

            if (prop === 'channel')
                return channel;

            return (target as any)[prop];
        }
    }) as unknown as DiscordChatInputCommandInteraction;

    const event = await DiscordService.mapInteractionToInteractionEventAsync(fakeInteraction);
    await handleDiscordInteractionAsync(event);
}

