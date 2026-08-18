import { CommandEnum } from "../interfaces/enums/commands/CommandEnum";
import { InteractionEvent, MessageInteractionEvent } from "../interfaces/application/Event";
import { Command, CommandOptionConfig } from "../interfaces/application/Command";
import { ExceptionEnum } from "../interfaces/enums";
import { MultiLingualString } from "../utils/i18n/MultiLingualString";
import { i18n } from "../utils/i18n/i18n";
import { getConfigValue } from "../utils/application/Config";
import { EnvConfigEnum } from "../interfaces/enums/application/EnvConfigEnum";
import GameService from "../services/domain/GameService";
import { ErrorHelper } from "../utils/application/Error";
import { impersonateSlashCommandAsync } from "../utils/application/CommandImpersonator";
import { GamesCommandActionEnum } from "../interfaces/enums/commands/Games";
import { getCommandName } from "../utils/collectors/CommandCollector";

const optionsConfig = [] satisfies CommandOptionConfig<string | number>[];

export class RestartGameCommand implements Command {
    name = CommandEnum.RESTARTGAME;
    description = new MultiLingualString(i18n.commands.restartGame.description);
    isSlashCommand = false;
    isMessageCommand = !getConfigValue(EnvConfigEnum.IS_PRODUCTION);
    options = optionsConfig;
    canExecute = (event: InteractionEvent): boolean => {
        return event.user.userId === getConfigValue(EnvConfigEnum.DISCORD_OWNER_ID);
    }

    async executeAsync(event: MessageInteractionEvent): Promise<void> {
        const game = await GameService.getGameByChannelIdAsync(event.channelId);
        if (!game)
            ErrorHelper.throw(ExceptionEnum.GAME_NOT_FOUND);

        await GameService.deleteAsync(game.Id);
        
        await impersonateSlashCommandAsync(
            event,
            event.user.userId,
            CommandEnum.GAMES,
            {
                [getCommandName(i18n.commands.games.option)]: GamesCommandActionEnum.SETUP
            }
        );
    }
}

export default new RestartGameCommand();