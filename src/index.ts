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
import { JobScheduler } from './services/application/JobScheduler';
import { initAsync } from './utils/registries/InitRegistry';
import { syncRoutines } from './utils/routines/Sync';
import { validateSchemaAsync } from './utils/database/GenerateSchema';
import TestMode from './utils/application/TestMode';

getConfig();

export const discordClient = new DiscordClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

discordClient.on('error', (error: Error) => {
  void Logger.logError('Discord client error', error);
});

discordClient.once('ready', async () => {
  Logger.logInfo(`Logged in as ${discordClient.user?.tag}`, {
    sendToDiscord: true
  });
  await createConnectionAsync().then(async (success) => {
    if (success) {
      if (!getConfigValue(EnvConfigEnum.DEBUG_MODE)) {
        try {
          // Pool now actually pools → these two DB-touching tasks run in parallel
          await Promise.all([syncRoutines(), validateSchemaAsync()]);
        } catch (err) {
          Logger.logError('Routine sync failed, shutting down', err as Error, { sendToDiscord: true });
          process.exit(1);
        }
      }
      await initAsync();
      // Command + event collectors are independent — load concurrently
      await Promise.all([
        loadCommands(discordClient),
        loadEvents(discordClient),
      ]);
      const port = Number(getConfigValue(EnvConfigEnum.DISGAMES_API_PORT) || 3600);
      startHttpServer(port);

      // Initialize the job scheduler
      JobScheduler.getInstance();
    } else {
      Logger.logError(`Failed to connect to database`);
    }
  });
});

// During test runs the DiscordClient is constructed only because something in the
// import graph touches `discordClient` (e.g. DiscordService). We must NOT log in or
// the bot's `ready` handler will race with tests, fire initAsync a second time, and
// try to bind the HTTP port that's already serving the test process.
if (!TestMode.isEnabled())
    discordClient.login(getConfigValue(EnvConfigEnum.TOKEN));