import { CommandEnum } from "../interfaces/enums/commands/CommandEnum";
import { InteractionEvent, MessageInteractionEvent } from "../interfaces/application/Event";
import { Command, CommandOptionConfig } from "../interfaces/application/Command";
import { ExceptionEnum } from "../interfaces/enums";
import { MultiLingualString } from "../utils/i18n/MultiLingualString";
import { i18n } from "../utils/i18n/i18n";
import { getConfigValue } from "../utils/application/Config";
import { EnvConfigEnum } from "../interfaces/enums/application/EnvConfigEnum";
import { ErrorHelper } from "../utils/application/Error";
import JobService from "../services/application/JobService";
import { DEFAULT_ACCEPT_EMOJI } from "../utils/constants/Emojis";

const optionsConfig = [] satisfies CommandOptionConfig<string | number>[];

export class RestartGameCommand implements Command {
    name = CommandEnum.JOB;
    description = new MultiLingualString(i18n.commands.job.description);
    isSlashCommand = false;
    isMessageCommand = true;
    options = optionsConfig;
    canExecute = (event: InteractionEvent): boolean => {
        return event.user.userId === getConfigValue(EnvConfigEnum.DISCORD_OWNER_ID);
    }

    async executeAsync(event: MessageInteractionEvent): Promise<void> {
        const jobId = event.content.split(' ')[1];
        if (!jobId)
            ErrorHelper.throw(ExceptionEnum.RECORD_NOT_FOUND);
        JobService.getJobById(jobId);
        await JobService.executeJobById(jobId);
        await event.reactAsync(DEFAULT_ACCEPT_EMOJI);
    }
}

export default new RestartGameCommand();