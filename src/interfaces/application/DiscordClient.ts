import { Client, ClientOptions, Collection } from 'discord.js';
import { Command } from './Command';

export interface DiscordClient extends Client {
    commands: Collection<string, Command>;
}

export class DiscordClient extends Client implements DiscordClient {
    commands: Collection<string, Command> = new Collection();

    constructor(options: ClientOptions) {
        super(options);
        this.commands = new Collection();
    }
} 