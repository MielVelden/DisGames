import path from "path";
import fs from "fs";
import { DiscordClient } from "../interfaces/application/DiscordClient";
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { Command, CommandOptionFollowUpType } from "../interfaces/application/Command";
import discordService from "../services/discord/DiscordService";
import { InteractionEvent, SlashCommandInteractionEvent } from "../interfaces/application/Event";
import { MultiLingualString } from "./i18n/MultiLingualString";
import { LanguageCommandOptionTranslations } from "./i18n/i18n";
import Logger from "./Logger";
import { isSelectMenuEmpty } from "./SelectMenu";
import ComponentService from "../services/application/ComponentService";
import { ExceptionEnum } from "../interfaces/enums";
import { ErrorHelper } from "./Error";

const commands: Command[] = [];

export async function loadCommands(client?: DiscordClient): Promise<Command[]> {
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    const loadedCommands: Command[] = [];

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath).default;
        if (command && command.name && command.description && command.executeAsync) {
            loadedCommands.push(command);
            commands.push(command);
            if (client) {
                client.commands.set(command.name, command);
            }
            Logger.logInfo(`Command loaded: ${command.name}`);
        } else {
            Logger.logWarning(`Command in ${filePath} is not a valid Command object!`);
        }
    }

    return loadedCommands;
}

export function getCommandConfig(commandName: string): Command | null {
    commandName = commandName.toLowerCase();
    const command = commands.find(c => c.name === commandName);
    if (!command)
        return null;
    
    return command;
}

export async function handleCommand(command: Command, event: InteractionEvent): Promise<void> {
    await command.executeAsync(event);
}

export async function handleCommandOptions(event: SlashCommandInteractionEvent): Promise<void> {
    if (event.command.options) {
        for (const option of event.command.options) {
            if (option.choices && option.choices.length > 0) {
                const selectedOption = event.getOption(getCommandName(option.key));
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

                                const selectMenuEvent = await currentEvent.getUserInputBySelectMenuAsync(selectMenu);
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
}

export function getCommandName(key: LanguageCommandOptionTranslations<string | number>): string {
    // Must be lowercase because Discord doesn't support uppercase options
    return new MultiLingualString(key.action).getMessage().toLowerCase();
}

export async function deployCommands(): Promise<void> {
    const token = process.env.TOKEN;
    const clientId = process.env.CLIENT_ID;

    if (!token || !clientId) {
        Logger.logError('Missing environment variables: TOKEN and/or CLIENT_ID must be set in .env file!');
        process.exit(1);
    }

    const loadedCommands = await loadCommands();
    const commandsForRegistration: any[] = [];

    for (const command of loadedCommands) {
        const slashCommandBuilder = discordService.mapCommandToSlashCommandBuilder(command as Command);
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