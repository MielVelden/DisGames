import path from "path";
import fs from "fs";
import { Guild } from "discord.js";
import { DiscordClient } from "../../interfaces/application/DiscordClient";
import Logger from "../application/Logger";
import { resolvePath } from "../helpers/PathResolver";
import { getConfigValue } from "../application/Config";
import { EnvConfigEnum } from "../../interfaces/enums/application/EnvConfigEnum";

const eventsPath = resolvePath('events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

export async function loadEvents(client: DiscordClient): Promise<void> {
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath).default;

        const listener = (...args: unknown[]) => {
            if (!isAllowedInDebugMode(args))
                return;

            return event.execute(...args, client);
        };

        if (event.once)
            client.once(event.name, listener);
        else
            client.on(event.name, listener);

        Logger.logInfo(`Event loaded: ${event.name}`);
    }
}

function isAllowedInDebugMode(args: unknown[]): boolean {
    if (!getConfigValue(EnvConfigEnum.DEBUG_MODE))
        return true;

    const guildId = extractGuildId(args[0]);
    return guildId !== null && guildId === getConfigValue(EnvConfigEnum.DISGAMES_SERVER_ID);
}

function extractGuildId(arg: unknown): string | null {
    if (arg instanceof Guild)
        return arg.id;

    if (arg && typeof arg === "object" && "guildId" in arg)
        return (arg as { guildId: string | null }).guildId;

    return null;
}