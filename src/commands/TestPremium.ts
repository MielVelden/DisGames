import { Command, CommandOptionConfig, CommandOptionType } from "../interfaces/application/Command";
import { InteractionEvent, SlashCommandInteractionEvent } from "../interfaces/application/Event";
import { CommandEnum } from "../interfaces/enums/commands/CommandEnum";
import { TestPremiumActionEnum } from "../interfaces/enums/commands/TestPremium";
import { i18n } from "../utils/i18n/i18n";
import { MultiLingualString } from "../utils/i18n/MultiLingualString";
import { getConfigValue } from "../utils/application/Config";
import { EnvConfigEnum } from "../interfaces/enums/application/EnvConfigEnum";
import { getPremiumSkuId } from "../utils/application/PremiumAccess";
import DiscordTestEntitlementService from "../services/discord/DiscordTestEntitlementService";
import ServerService from "../services/domain/ServerService";
import { getCommandName } from "../utils/collectors/CommandCollector";
import { handleErrorAsync } from "../utils/application/Error";

const optionsConfig = [
    {
        key: i18n.commands.testPremium.option,
        type: CommandOptionType.STRING,
        required: true,
        choices: [
            {
                enumValue: TestPremiumActionEnum.GRANT_USER,
                handler: async (event: SlashCommandInteractionEvent) => {
                    const skuId = getPremiumSkuId();
                    if (!skuId) {
                        await event.replyAsync(new MultiLingualString(i18n.commands.testPremium.labels.missingSku), true);
                        return;
                    }
                    const target = event.getOption(getCommandName(i18n.commands.testPremium.optionTarget)) as string | undefined;
                    const userId = (target && target.trim()) || event.user.userId;
                    try {
                        const ent = await DiscordTestEntitlementService.createUserTestEntitlementAsync(
                            skuId,
                            userId
                        );
                        await event.replyAsync(new MultiLingualString(i18n.commands.testPremium.labels.created, { id: ent.id }), true);
                    } catch (error) {
                        await handleErrorAsync(error, event);
                    }
                }
            },
            {
                enumValue: TestPremiumActionEnum.GRANT_GUILD,
                handler: async (event: SlashCommandInteractionEvent) => {
                    const skuId = getPremiumSkuId();
                    if (!skuId) {
                        await event.replyAsync(new MultiLingualString(i18n.commands.testPremium.labels.missingSku), true);
                        return;
                    }
                    const target = event.getOption(getCommandName(i18n.commands.testPremium.optionTarget)) as string | undefined;
                    const guildId = (target && target.trim()) || event.guildId;
                    if (!guildId) {
                        await event.replyAsync(new MultiLingualString(i18n.commands.testPremium.labels.missingGuild), true);
                        return;
                    }
                    try {
                        const ent = await DiscordTestEntitlementService.createGuildTestEntitlementAsync(
                            skuId,
                            guildId
                        );
                        await event.replyAsync(new MultiLingualString(i18n.commands.testPremium.labels.created, { id: ent.id }), true);
                    } catch (error) {
                        await handleErrorAsync(error, event);
                    }
                }
            },
            {
                enumValue: TestPremiumActionEnum.REVOKE,
                handler: async (event: SlashCommandInteractionEvent) => {
                    const entitlementId = event.getOption(getCommandName(i18n.commands.testPremium.optionTarget)) as string | undefined;
                    if (!entitlementId || !String(entitlementId).trim()) {
                        await event.replyAsync(new MultiLingualString(i18n.commands.testPremium.labels.missingTarget), true);
                        return;
                    }
                    try {
                        await DiscordTestEntitlementService.deleteTestEntitlementAsync(
                            String(entitlementId).trim()
                        );
                        await event.replyAsync(new MultiLingualString(i18n.commands.testPremium.labels.deleted), true);
                    } catch (error) {
                        await handleErrorAsync(error, event);
                    }
                }
            },
            {
                enumValue: TestPremiumActionEnum.TOGGLE_DB,
                handler: async (event: SlashCommandInteractionEvent) => {
                    const target = event.getOption(getCommandName(i18n.commands.testPremium.optionTarget)) as string | undefined;
                    const guildId = (target && target.trim()) || event.guildId;
                    if (!guildId) {
                        await event.replyAsync(new MultiLingualString(i18n.commands.testPremium.labels.missingGuild), true);
                        return;
                    }
                    try {
                        const server = await ServerService.getByExternalIdAsync(guildId);
                        if (server.IsPremium) {
                            await ServerService.handlePremiumRevokedAsync(guildId);
                            await event.replyAsync(new MultiLingualString(i18n.commands.testPremium.labels.toggledOff), true);
                        } else {
                            await ServerService.handlePremiumGrantedAsync(guildId);
                            await event.replyAsync(new MultiLingualString(i18n.commands.testPremium.labels.toggledOn), true);
                        }
                    } catch (error) {
                        await handleErrorAsync(error, event);
                    }
                }
            },
        ],
    },
    {
        key: i18n.commands.testPremium.optionTarget,
        type: CommandOptionType.STRING,
        required: false,
        choices: [],
    },
] as CommandOptionConfig<string | number>[];

export class TestPremiumCommand implements Command {
    name = CommandEnum.TEST_PREMIUM;
    description = new MultiLingualString(i18n.commands.testPremium.description);
    isSlashCommand = !getConfigValue(EnvConfigEnum.IS_PRODUCTION);
    isMessageCommand = false;
    permissions = [];
    options = optionsConfig;
    canExecute = (event: InteractionEvent): boolean => {
        return event.user.userId === getConfigValue(EnvConfigEnum.DISCORD_OWNER_ID);
    }

    async executeAsync(event: SlashCommandInteractionEvent): Promise<void> {
        await event.handleCommandOptionsAsync();
    }
}

export default new TestPremiumCommand();
