import path from "path";
import fs from "fs";
import { DiscordClient } from "../../interfaces/application/DiscordClient";
import Logger from "../application/Logger";
import { resolveSrcPath } from "../helpers/PathResolver";

const eventsPath = resolveSrcPath('events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

export async function loadEvents(client: DiscordClient): Promise<void> {
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath).default;

        if (event.once)
            client.once(event.name, (...args) => event.execute(...args, client));
        else
            client.on(event.name, (...args) => event.execute(...args, client));

        Logger.logInfo(`Event loaded: ${event.name}`);
    }
}