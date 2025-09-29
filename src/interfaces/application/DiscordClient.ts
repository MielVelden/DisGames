import { Client, ClientOptions } from 'discord.js';
import { Command } from './Command';

export interface DiscordClient extends Client {
    commands: Map<string, Command>;
}

export class DiscordClient extends Client implements DiscordClient {
    commands: Map<string, Command> = new Map();

    constructor(options: ClientOptions) {
        super(options);
        this.commands = new Map();
    }
} 