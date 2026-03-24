import { Command } from "../../interfaces/application/Command";
import { DiscordClient } from "../../interfaces/application/DiscordClient";
import path from "path";
import fs from "fs";
import Logger from "../application/Logger";
import { MultiLingualString } from "../i18n/MultiLingualString";
import { LanguageCommandOptionTranslations } from "../../interfaces/application/i18n";
import { resolvePath } from "../helpers/PathResolver";
import { LanguageEnum } from "../../interfaces/enums/database/LanguageEnum";

const commands: Command[] = [];

export async function loadCommands(client?: DiscordClient): Promise<Command[]> {
    const commandsPath = resolvePath('commands');
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

export function getCommandName(key: LanguageCommandOptionTranslations<string | number>, language?: LanguageEnum): string {
    // Must be lowercase because Discord doesn't support uppercase options
    return new MultiLingualString(key.action).getMessage(language).toLowerCase();
}