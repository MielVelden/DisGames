import 'reflect-metadata';
import { GatewayIntentBits } from 'discord.js';
import { DiscordClient } from './interfaces/application/DiscordClient';
import { loadEvents } from './utils/collectors/EventCollector';
import { loadCommands } from './utils/collectors/CommandCollector';
import { createConnectionAsync } from './repositories/util/ConnectionHandler';
import Logger from './utils/application/Logger';
import { startHttpServer } from './server';
import { getConfig, getConfigValue } from './utils/application/Config';
import { EnvConfigEnum } from './interfaces/enums/application/EnvConfigEnum';

getConfig();

const client = new DiscordClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.once('ready', async () => {
  Logger.logInfo(`Logged in as ${client.user?.tag}`);
  await createConnectionAsync().then(async (success) => {
    if (success) {
      await loadCommands(client);
      await loadEvents(client);
      const port = Number(getConfigValue(EnvConfigEnum.DISGAMES_API_PORT) || 3600);
      startHttpServer(port);
    } else {
      Logger.logError(`Failed to connect to database`);
    }
  });
});

client.login(getConfigValue(EnvConfigEnum.TOKEN));