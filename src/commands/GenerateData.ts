import { CommandEnum } from '../interfaces/enums/commands/CommandEnum';
import { GenerateDataSubcommandEnum } from '../interfaces/enums/commands/GenerateData';
import { InteractionEvent, MessageInteractionEvent } from '../interfaces/application/Event';
import { Command, CommandOptionConfig } from '../interfaces/application/Command';
import { MultiLingualString } from '../utils/i18n/MultiLingualString';
import { i18n } from '../utils/i18n/i18n';
import { getConfigValue } from '../utils/application/Config';
import { EnvConfigEnum } from '../interfaces/enums/application/EnvConfigEnum';
import ContentGenerationService from '../services/application/ContentGenerationService';
import ContentTranslationService from '../services/application/ContentTranslationService';
import { isValidEnumValue } from '../utils/helpers/Enum';
import { GameTypeEnum } from '../interfaces/enums';

const optionsConfig = [] satisfies CommandOptionConfig<string | number>[];

export class GenerateDataCommand implements Command {
    name = CommandEnum.GENERATE_DATA;
    description = new MultiLingualString(i18n.commands.generateData.description);
    isSlashCommand = false;
    isMessageCommand = true;
    options = optionsConfig;
    canExecute = (event: InteractionEvent): boolean => {
        return event.user.userId === getConfigValue(EnvConfigEnum.DISCORD_OWNER_ID);
    };

    async executeAsync(event: MessageInteractionEvent): Promise<void> {
        const parts = (event.content as string).trim().split(/\s+/);
        const subcommand = parts[1]?.toLowerCase();

        if (subcommand === GenerateDataSubcommandEnum.GENERATE) {
            await this.handleGenerateAsync(parts.slice(2), event);
        } else if (subcommand === GenerateDataSubcommandEnum.TRANSLATE) {
            await this.handleTranslateAsync(parts.slice(2), event);
        } else {
            await event.replyAsync(new MultiLingualString(i18n.commands.generateData.labels.unknownSubcommand));
        }
    }

    private async handleGenerateAsync(args: string[], event: MessageInteractionEvent): Promise<void> {
        const [gameTypeAlias, dataSheetIdRaw, theme, countRaw] = args;

        const gameTypeId = parseInt(gameTypeAlias, 10);
        if (isNaN(gameTypeId) || !isValidEnumValue(GameTypeEnum, gameTypeId)) {
            await event.replyAsync(new MultiLingualString(i18n.commands.generateData.labels.unknownGameType));
            return;
        }

        const dataSheetId = dataSheetIdRaw ? parseInt(dataSheetIdRaw, 10) : undefined;
        const count = countRaw ? parseInt(countRaw, 10) : 20;

        await event.replyAsync(new MultiLingualString(i18n.commands.generateData.labels.generating));

        const result = await ContentGenerationService.generateAsync(event, gameTypeId as GameTypeEnum, dataSheetId, theme, count);

        await event.clearComponentsAsync();
        await event.replyAsync(i18n.commands.generateData.labels.generateSummary(
            result.generated,
            result.skipped,
            result.failed.length,
        ));
    }

    private async handleTranslateAsync(args: string[], event: MessageInteractionEvent): Promise<void> {
        const [gameTypeAlias] = args;

        const gameTypeId = parseInt(gameTypeAlias, 10);
        if (isNaN(gameTypeId) || !isValidEnumValue(GameTypeEnum, gameTypeId)) {
            await event.replyAsync(new MultiLingualString(i18n.commands.generateData.labels.unknownGameType));
            return;
        }

        await event.replyAsync(new MultiLingualString(i18n.commands.generateData.labels.translating));

        const result = await ContentTranslationService.translateAsync(gameTypeId as GameTypeEnum, event);

        await event.replyAsync(i18n.commands.generateData.labels.translateSummary(
            result.translated,
            result.skipped,
            result.failed.length,
        ));
    }
}

export default new GenerateDataCommand();
