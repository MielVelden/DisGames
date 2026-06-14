import { Command } from "../interfaces/application/Command";
import { InteractionEvent, SlashCommandInteractionEvent } from "../interfaces/application/Event";
import { i18n } from "../utils/i18n/i18n";
import { MultiLingualString } from "../utils/i18n/MultiLingualString";
import { CommandEnum } from "../interfaces/enums/commands/CommandEnum";
import { ButtonStyle, Permission } from "../interfaces/application";
import { createSettingsContainer } from "../builders/containers/SettingsContainer";
import { createGenericButton } from "../builders/buttons/GenericButton";
import ComponentService from "../services/application/ComponentService";
import ServerService from "../services/domain/ServerService";
import { ServersSaveModel } from "../interfaces/database";
import { LanguageEnum } from "../interfaces/enums";
import { createLanguageSelectMenu } from "../builders/selectmenus/LanguageSelectMenu";
import GameService from "../services/domain/GameService";
import { DEFAULT_ACCEPT_EMOJI, DEFAULT_WRONG_ANSWER_EMOJI, isValidEmoji } from "../utils/constants/Emojis";

export class SettingsCommand implements Command {
    name = CommandEnum.SETTINGS;
    description = new MultiLingualString(i18n.commands.settings.description);
    isSlashCommand = true;
    isMessageCommand = false;
    permissions = [Permission.ADMINISTRATOR];

    async executeAsync(event: SlashCommandInteractionEvent): Promise<void> {
        const server = await ServerService.getByExternalIdAsync(event.guildId);
        const activeGames = await GameService.getActiveGamesAsync(server.ServerId);
        
        const changeLanguageButton = createGenericButton(new MultiLingualString(i18n.commands.settings.labels.changeLanguage), ButtonStyle.SECONDARY, "🌐", event.user.userId, async (event: InteractionEvent) => {
            const languageSelectMenu = createLanguageSelectMenu();
            const languageEvent = await event.getUserInputBySelectMenuAsync(languageSelectMenu);
            if(languageEvent) {
                const languageKey = languageEvent.selected as keyof typeof LanguageEnum;
                const language = LanguageEnum[languageKey];
                await ServerService.saveAsync(new ServersSaveModel({
                    Id: server.Id,
                    LanguageEnum: language
                }), languageEvent);
                await languageEvent.editWithComponentsAsync([ComponentService.createContent(new MultiLingualString(i18n.commands.settings.labels.languageChanged))]);
            }
        });

        const changeEmojisButton = createGenericButton(new MultiLingualString(i18n.commands.settings.labels.changeEmojis), ButtonStyle.SECONDARY, "😀", event.user.userId, async (buttonEvent: InteractionEvent) => {
            const result = await buttonEvent.askUserAsync({
                title: new MultiLingualString(i18n.commands.settings.labels.emojiModalTitle),
                fields: {
                    acceptEmoji: {
                        label: new MultiLingualString(i18n.commands.settings.labels.acceptEmojiLabel),
                        value: server.Settings?.defaultAcceptEmoji ?? DEFAULT_ACCEPT_EMOJI,
                        minLength: 1,
                        maxLength: 10,
                    },
                    rejectEmoji: {
                        label: new MultiLingualString(i18n.commands.settings.labels.rejectEmojiLabel),
                        value: server.Settings?.defaultRejectEmoji ?? DEFAULT_WRONG_ANSWER_EMOJI,
                        minLength: 1,
                        maxLength: 10,
                    }
                }
            });
            if (result) {
                if (!isValidEmoji(result.acceptEmoji) || !isValidEmoji(result.rejectEmoji)) {
                    await event.editWithComponentsAsync([ComponentService.createContent(new MultiLingualString(i18n.commands.settings.labels.invalidEmoji))]);
                    return;
                }
                await ServerService.saveAsync(new ServersSaveModel({
                    Id: server.Id,
                    SettingsJSON: {
                        ...server.Settings,
                        defaultAcceptEmoji: result.acceptEmoji.trim(),
                        defaultRejectEmoji: result.rejectEmoji.trim()
                    }
                }), buttonEvent);
                await event.editWithComponentsAsync([ComponentService.createContent(new MultiLingualString(i18n.commands.settings.labels.emojisChanged))]);
            }
        });

        const settingsContainer = createSettingsContainer({
            LanguageEnum: server.LanguageEnum,
            ServerName: server.Name,
            GamesEnabled: activeGames.length
        }, [changeLanguageButton, changeEmojisButton]);
        await event.addComponentsAsync(settingsContainer);
        await event.replyAsync();
    }
}

export default new SettingsCommand(); 