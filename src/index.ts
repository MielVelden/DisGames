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
import './utils/registries/ServiceRegistry';
import { syncRoutines } from './utils/routines/Sync';
import { validateSchemaAsync } from './utils/database/GenerateSchema';
import TestMode from './utils/application/TestMode';
import { gracefulShutdown, isStandby } from './utils/application/HandoffManager';

getConfig();

export const discordClient = new DiscordClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    // GatewayIntentBits.MessageContent, WAIT FOR VERIFICATION
    GatewayIntentBits.GuildMessageReactions,
  ],
});

discordClient.on('error', (error: Error) => {
  void Logger.logError('Discord client error', error);
});

discordClient.once('clientReady', async () => {
  Logger.logInfo(`Logged in as ${discordClient.user?.tag}`, {
    sendToDiscord: getConfigValue(EnvConfigEnum.IS_PRODUCTION)
  });
  await createConnectionAsync().then(async (success) => {
    if (success) {
      if (getConfigValue(EnvConfigEnum.IS_PRODUCTION)) {
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
      if (getConfigValue(EnvConfigEnum.DISGAMES_API_ENABLED)) {
        const port = Number(getConfigValue(EnvConfigEnum.DISGAMES_API_PORT) || 3600);
        startHttpServer(port);
      }

      // Initialize the job scheduler
      JobScheduler.getInstance();
    } else {
      Logger.logError(`Failed to connect to database`);
    }
  });
});

if (isStandby())
  Logger.logInfo('Starting in standby mode. Not responding to events until handoff');

process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

// During test runs the DiscordClient is constructed only because something in the
// import graph touches `discordClient` (e.g. DiscordService). We must NOT log in or
// the bot's `ready` handler will race with tests, fire initAsync a second time, and
// try to bind the HTTP port that's already serving the test process.
if (!TestMode.isEnabled())
  discordClient.login(getConfigValue(EnvConfigEnum.TOKEN));