import { i18n } from '../utils/i18n/i18n';
import { MultiLingualString } from '../utils/i18n/MultiLingualString';
import { CommandEnum } from '../interfaces/enums/commands/CommandEnum';
import { InteractionEvent, MessageInteractionEvent } from '../interfaces/application/Event';
import { Command } from '../interfaces/application/Command';
import { getConfigValue } from '../utils/application/Config';
import { EnvConfigEnum } from '../interfaces/enums/application/EnvConfigEnum';
import { isStandby, activate, gracefulShutdown } from '../utils/application/HandoffManager';
import Logger from '../utils/application/Logger';

export class HandoffCommand implements Command {
    name = CommandEnum.HANDOFF;
    description = new MultiLingualString(i18n.commands.handoff.description);
    isSlashCommand = false;
    isMessageCommand = true;
    forceCheck = true;
    options = [];

    canExecute = (event: InteractionEvent): boolean => {
        return event.user.userId === getConfigValue(EnvConfigEnum.DISCORD_OWNER_ID);
    };

    async executeAsync(event: MessageInteractionEvent): Promise<void> {
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

        if (isStandby()) {
            activate();
            Logger.logInfo('Handoff received — this instance is now active', { sendToDiscord: true });
            await event.replyAsync(new MultiLingualString(i18n.commands.handoff.labels.activated, { time }));
        } else {
            await event.replyAsync(new MultiLingualString(i18n.commands.handoff.labels.shuttingDown, { time }));
            void gracefulShutdown('Handoff command received');
        }
    }
}

export default new HandoffCommand();
