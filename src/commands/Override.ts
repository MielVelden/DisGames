import { CommandEnum } from "../interfaces/enums/commands/CommandEnum";
import { InteractionEvent, MessageInteractionEvent } from "../interfaces/application/Event";
import { Command, CommandOptionConfig } from "../interfaces/application/Command";
import { ExceptionEnum } from "../interfaces/enums";
import { OverrideKeyEnum } from "../interfaces/enums/application/OverrideKeyEnum";
import { MultiLingualString } from "../utils/i18n/MultiLingualString";
import { i18n } from "../utils/i18n/i18n";
import { getConfigValue } from "../utils/application/Config";
import { EnvConfigEnum } from "../interfaces/enums/application/EnvConfigEnum";
import { ErrorHelper } from "../utils/application/Error";
import OverrideService from "../services/application/OverrideService";
import StyleService from "../services/domain/StyleService";
import { DEFAULT_ACCEPT_EMOJI } from "../utils/constants/Emojis";

const optionsConfig = [] satisfies CommandOptionConfig<string | number>[];

const RESET_VALUE = 'reset';

const validators: Record<OverrideKeyEnum, (value: string) => boolean> = {
    [OverrideKeyEnum.STYLE]: value => StyleService.getPresets().some(p => p.id === value),
};

export class OverrideCommand implements Command {
    name = CommandEnum.OVERRIDE;
    description = new MultiLingualString(i18n.commands.override.description);
    isSlashCommand = false;
    isMessageCommand = true;
    options = optionsConfig;
    canExecute = (event: InteractionEvent): boolean => {
        return event.user.userId === getConfigValue(EnvConfigEnum.DISCORD_OWNER_ID);
    }

    // Usage: override <key> <value|reset>   e.g. "override style christmas"
    async executeAsync(event: MessageInteractionEvent): Promise<void> {
        const [, rawKey, rawValue] = event.content.trim().split(/\s+/);

        const key = Object.values(OverrideKeyEnum).find(k => k === rawKey?.toLowerCase());
        if (!key || !rawValue)
            return ErrorHelper.throw(ExceptionEnum.INVALID_ARGUMENT);

        const value = rawValue.toLowerCase();
        if (value === RESET_VALUE)
            OverrideService.clear(key);
        else if (validators[key](value))
            OverrideService.set(key, value);
        else
            return ErrorHelper.throw(ExceptionEnum.INVALID_ARGUMENT);

        await event.reactAsync(DEFAULT_ACCEPT_EMOJI);
    }
}

export default new OverrideCommand();
