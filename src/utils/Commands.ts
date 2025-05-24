import path from "path";
import fs from "fs";
import { DiscordClient } from "../interfaces/application/DiscordClient";
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { Command } from "../interfaces/application/Command";
import discordService from "../services/DiscordService";
import { InteractionEvent } from "../interfaces/application/Event";

const commands: Command[] = [];

export async function loadCommands(client: DiscordClient): Promise<void> {
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath).default;
        commands.push(command);
        if (command && command.name && command.description && command.executeAsync) {
            client.commands.set(command.name, command);
            console.log(`[INFO] Command loaded: ${command.name}`);
        } else {
            console.warn(`[WARNING] Command in ${filePath} is not a valid Command object!`);
        }
    }
}

export async function handleCommand(commandName: string, event: InteractionEvent): Promise<void> {
    const command = commands.find(c => c.name === commandName);
    if (!command) {
        console.error(`[ERROR] Command ${commandName} not found!`);
        return;
    }

    await command.executeAsync(event);
}

export async function deployCommands(): Promise<void> {
    const token = process.env.TOKEN;
    const clientId = process.env.CLIENT_ID;

    if (!token || !clientId) {
        console.error('Missing environment variables: TOKEN and/or CLIENT_ID must be set in .env file!');
        process.exit(1);
    }

    const commands: any[] = [];
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath).default;

        if (command && command.name && command.description && command.executeAsync) {
            const slashCommandBuilder = discordService.mapCommandToSlashCommandBuilder(command as Command);
            commands.push(slashCommandBuilder.toJSON());
            console.log(`[INFO] Command added for registration: ${command.name}`);
        } else {
            console.warn(`[WARNING] Command in ${filePath} is not a valid Command object!`);
        }
    }

    const rest = new REST().setToken(token);

    try {
        console.log(`Starting refresh of ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        ) as any[];

        console.log(`Successfully registered ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
        throw error;
    }
}