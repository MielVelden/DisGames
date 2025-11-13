import { i18n } from "../utils/i18n/i18n";
import { MultiLingualString } from "../utils/i18n/MultiLingualString";
import { CommandEnum } from "../interfaces/enums/commands/CommandEnum";
import { MessageInteractionEvent } from "../interfaces/application/Event";
import Logger from "../utils/application/Logger";
import { WebhookType } from "../interfaces/application";
import DebugService from "../services/domain/DebugService";
import GameRepository from "../repositories/GameRepository";
import { Command } from "../interfaces/application/Command";
import { Permission } from "../interfaces/enums/application/Permission";
import { DebugSaveModel } from "../interfaces/database/TableInterfaces";

export class DebugCommand implements Command {
    name = CommandEnum.DEBUG;
    description = new MultiLingualString(i18n.commands.debug.description);
    isSlashCommand = false;
    isMessageCommand = true;
    permissions = [Permission.ADMINISTRATOR];
    options = [];

    async executeAsync(event: MessageInteractionEvent): Promise<void> {
        const uniqueCode = event.content.split(' ')[1];
        if (!uniqueCode)
            return;
        
        // Handle debug record command
        const debugRecord = await DebugService.getByExternalIdAsync(uniqueCode);

        if (!debugRecord || debugRecord.UpdatedAt === null)
            return;

        // Collect data from the server
        debugRecord.ServerId = event.server.Id;

        const games = await GameRepository.getByServerIdAsync(event.server.ServerId);
        debugRecord.Data = {
            games: games.map(game => ({
                id: game.Id,
                name: game.GameTypeEnum,
                channelId: game.ChannelId,
                serverId: game.ServerId,
                answer: typeof game.Answer === 'string' && game.Answer.length > 50
                    ? game.Answer.slice(0, 50) + '…'
                    : game.Answer,
                settings: game.Settings
            }))
        };

        // Save debug record
        await DebugService.saveAsync(debugRecord, event);

        // Create a new debug record
        const newDebugEvent = await DebugService.saveAsync(new DebugSaveModel({}), event);
        await Logger.logDebugCommand(debugRecord, newDebugEvent.UniqueCode, { webhookType: WebhookType.DEBUG, sendToDiscord: true });
        await event.replyAsync(new MultiLingualString(i18n.commands.debug.labels.thanks));
    }
}

export default new DebugCommand(); 
