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
import { RoutineSyncService } from './utils/routines/RoutineSyncService';

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
      try {
        await RoutineSyncService.syncRoutines();
      } catch (err) {
        Logger.logError('Routine sync failed, shutting down', err as Error, { sendToDiscord: true });
        process.exit(1);
      }
      await initAsync();
      await loadCommands(discordClient);
      await loadEvents(discordClient);
      const port = Number(getConfigValue(EnvConfigEnum.DISGAMES_API_PORT) || 3600);
      startHttpServer(port);

      // Initialize the job scheduler
      JobScheduler.getInstance();
    } else {
      Logger.logError(`Failed to connect to database`);
    }
  });
});

discordClient.login(getConfigValue(EnvConfigEnum.TOKEN));