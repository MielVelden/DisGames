import { Command, CommandOptionFollowUpType } from "../../interfaces/application/Command";
import { InteractionEvent, SlashCommandInteractionEvent, SelectMenuInteractionEvent } from "../../interfaces/application/Event";
import { getCommandName } from "../collectors/CommandCollector";
import { DEFAULT_LANGUAGE, MultiLingualString } from "../i18n/MultiLingualString";
import { isSelectMenuEmpty } from "../helpers/SelectMenu";
import ComponentService from "../../services/application/ComponentService";
import Logger from "../application/Logger";
import { ErrorHelper } from "../application/Error";
import { loadCommands } from "../collectors/CommandCollector";
import { ExceptionEnum } from "../../interfaces/enums";
import DiscordService from "../../services/discord/DiscordService";
import { REST } from "discord.js";
import { Routes } from "discord.js";
import { EnvConfigEnum } from "../../interfaces/enums/application/EnvConfigEnum";
import { getConfigValue } from "../application/Config";
import { withEventContextAsync } from "../../middleware/EventContext";

export async function handleCommandAsync(command: Command, event: InteractionEvent): Promise<void> {
    await withEventContextAsync(event, async () => {
        await command.executeAsync(event);
    });
}

export async function handleCommandOptionsAsync(event: SlashCommandInteractionEvent): Promise<void> {
    return withEventContextAsync(event, async () => {
        if (event.command.options) {
            for (const option of event.command.options) {
                if (option.choices && option.choices.length > 0) {
                    const selectedOption = event.getOption(getCommandName(option.key, DEFAULT_LANGUAGE));
                    const choice = option.choices.find(c => c.enumValue === selectedOption);
                    if (choice) {
                        if (choice.validate) {
                            const isValid = await choice.validate(event);
                            if (!isValid)
                                return await event.replyAsync(new MultiLingualString(option.key.noAction));
                        }

                        if (choice.followUps) {
                            let allFollowUpsCompleted = true;
                            let currentEvent: InteractionEvent = event;
                            for (const followUp of choice.followUps) {
                                if (followUp.type === CommandOptionFollowUpType.SELECT_MENU) {
                                    const selectMenu = await followUp.configAsync(event);

                                    if(isSelectMenuEmpty(selectMenu)) {
                                        if (followUp.emptyReply) {
                                            await event.addComponentAsync(ComponentService.createContainer({
                                                description: followUp.emptyReply,
                                            }));
                                            await event.replyAsync();
                                        }

                                        return;
                                    }

                                    const selectMenuEvent: SelectMenuInteractionEvent | null = await currentEvent.getUserInputBySelectMenuAsync(selectMenu);
                                    if (selectMenuEvent) {
                                        event.setFollowUpOption(followUp.key, selectMenuEvent.selected);
                                        currentEvent = selectMenuEvent;
                                    } else {
                                        allFollowUpsCompleted = false;
                                        break;
                                    }
                                }
                            }

                            if (!allFollowUpsCompleted)
                                return;
                        }

                        if (choice.handler)
                            await choice.handler(event);
                    } else
                        return await event.replyAsync(new MultiLingualString(option.key.noAction));
                }
            }
        }
    });
}



export async function deployCommands(): Promise<void> {
    const token = getConfigValue(EnvConfigEnum.TOKEN);
    const clientId = getConfigValue(EnvConfigEnum.DISCORD_CLIENT_ID);

    const loadedCommands = await loadCommands();
    const commandsForRegistration: any[] = [];

    for (const command of loadedCommands) {
        const slashCommandBuilder = DiscordService.mapCommandToSlashCommandBuilder(command as Command);
        commandsForRegistration.push(slashCommandBuilder.toJSON());
        Logger.logInfo(`Command added for registration: ${command.name}`);
    }

    const rest = new REST().setToken(token);

    try {
        Logger.logInfo(`Starting refresh of ${commandsForRegistration.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commandsForRegistration },
        ) as any[];

        Logger.logInfo(`Successfully registered ${data.length} application (/) commands.`);
    } catch (error) {
        Logger.logError(`Error registering commands: ${error as Error}`);
        ErrorHelper.wrap(error, ExceptionEnum.COMMAND_REGISTRATION_FAILED);
    }
}