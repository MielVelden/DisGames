import { Command, CommandOptionConfig, CommandOptionType } from "../interfaces/application/Command";
import { InteractionEvent, SlashCommandInteractionEvent } from "../interfaces/application/Event";
import { CommandEnum } from "../interfaces/enums/commands/CommandEnum";
import { PremiumActionEnum } from "../interfaces/enums/commands/Premium";
import { i18n } from "../utils/i18n/i18n";
import { MultiLingualString } from "../utils/i18n/MultiLingualString";
import { getConfigValue } from "../utils/application/Config";
import { EnvConfigEnum } from "../interfaces/enums/application/EnvConfigEnum";
import { getPremiumSkuId, isPurchaseButtonEnabled, setPurchaseButtonEnabled } from "../utils/application/PremiumAccess";
import DiscordTestEntitlementService from "../services/discord/DiscordTestEntitlementService";
import DiscordPremiumService from "../services/discord/DiscordPremiumService";
import ServerService from "../services/domain/ServerService";
import { getCommandName } from "../utils/collectors/CommandCollector";
import { handleErrorAsync } from "../utils/application/Error";

const optionsConfig = [
    {
        key: i18n.commands.premium.option,
        type: CommandOptionType.STRING,
        required: true,
        choices: [
            {
                enumValue: PremiumActionEnum.GRANT_USER,
                handler: async (event: SlashCommandInteractionEvent) => {
                    const skuId = getPremiumSkuId();
                    if (!skuId) {
                        await event.replyAsync(new MultiLingualString(i18n.commands.premium.labels.missingSku), true);
                        return;
                    }
                    const target = event.getOption(getCommandName(i18n.commands.premium.optionTarget)) as string | undefined;
                    const userId = (target && target.trim()) || event.user.userId;
                    try {
                        const ent = await DiscordTestEntitlementService.createUserTestEntitlementAsync(
                            skuId,
                            userId
                        );
                        await event.replyAsync(new MultiLingualString(i18n.commands.premium.labels.created, { id: ent.id }), true);
                    } catch (error) {
                        await handleErrorAsync(error, event);
                    }
                }
            },
            {
                enumValue: PremiumActionEnum.GRANT_GUILD,
                handler: async (event: SlashCommandInteractionEvent) => {
                    const skuId = getPremiumSkuId();
                    if (!skuId) {
                        await event.replyAsync(new MultiLingualString(i18n.commands.premium.labels.missingSku), true);
                        return;
                    }
                    const target = event.getOption(getCommandName(i18n.commands.premium.optionTarget)) as string | undefined;
                    const guildId = (target && target.trim()) || event.guildId;
                    if (!guildId) {
                        await event.replyAsync(new MultiLingualString(i18n.commands.premium.labels.missingGuild), true);
                        return;
                    }
                    try {
                        const ent = await DiscordTestEntitlementService.createGuildTestEntitlementAsync(
                            skuId,
                            guildId
                        );
                        await event.replyAsync(new MultiLingualString(i18n.commands.premium.labels.created, { id: ent.id }), true);
                    } catch (error) {
                        await handleErrorAsync(error, event);
                    }
                }
            },
            {
                enumValue: PremiumActionEnum.REVOKE,
                handler: async (event: SlashCommandInteractionEvent) => {
                    const entitlementId = event.getOption(getCommandName(i18n.commands.premium.optionTarget)) as string | undefined;
                    if (!entitlementId || !String(entitlementId).trim()) {
                        await event.replyAsync(new MultiLingualString(i18n.commands.premium.labels.missingTarget), true);
                        return;
                    }
                    try {
                        await DiscordTestEntitlementService.deleteTestEntitlementAsync(
                            String(entitlementId).trim()
                        );
                        await event.replyAsync(new MultiLingualString(i18n.commands.premium.labels.deleted), true);
                    } catch (error) {
                        await handleErrorAsync(error, event);
                    }
                }
            },
            {
                enumValue: PremiumActionEnum.TOGGLE_DB,
                handler: async (event: SlashCommandInteractionEvent) => {
                    const target = event.getOption(getCommandName(i18n.commands.premium.optionTarget)) as string | undefined;
                    const guildId = (target && target.trim()) || event.guildId;
                    if (!guildId) {
                        await event.replyAsync(new MultiLingualString(i18n.commands.premium.labels.missingGuild), true);
                        return;
                    }
                    try {
                        const server = await ServerService.getByExternalIdAsync(guildId);
                        if (server.IsPremium) {
                            await DiscordPremiumService.handlePremiumRevokedAsync(guildId);
                            await event.replyAsync(new MultiLingualString(i18n.commands.premium.labels.toggledOff), true);
                        } else {
                            await DiscordPremiumService.handlePremiumGrantedAsync(guildId);
                            await event.replyAsync(new MultiLingualString(i18n.commands.premium.labels.toggledOn), true);
                        }
                    } catch (error) {
                        await handleErrorAsync(error, event);
                    }
                }
            },
            {
                enumValue: PremiumActionEnum.TOGGLE_PURCHASE_BUTTON,
                handler: async (event: SlashCommandInteractionEvent) => {
                    const enabled = !isPurchaseButtonEnabled();
                    setPurchaseButtonEnabled(enabled);
                    await event.replyAsync(new MultiLingualString(enabled
                        ? i18n.commands.premium.labels.purchaseButtonEnabled
                        : i18n.commands.premium.labels.purchaseButtonDisabled), true);
                }
            },
        ],
    },
    {
        key: i18n.commands.premium.optionTarget,
        type: CommandOptionType.STRING,
        required: false,
        choices: [],
    },
] as CommandOptionConfig<string | number>[];

export class PremiumCommand implements Command {
    name = CommandEnum.PREMIUM;
    description = new MultiLingualString(i18n.commands.premium.description);
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

export default new PremiumCommand();
