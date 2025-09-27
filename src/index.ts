import { GatewayIntentBits } from 'discord.js';
import { TOKEN } from './config';
import { DiscordClient } from './interfaces/application/DiscordClient';
import { loadEvents } from './utils/Events';
import { loadCommands } from './utils/Commands';
import { createConnectionAsync } from './repositories/util/ConnectionHandler';
import Logger from './utils/Logger';
import { startHttpServer } from './server';

const token = TOKEN;
if (!token) {
  Logger.logError('No Discord token found in .env file!');
  process.exit(1);
}

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
      const port = Number(process.env.DISGAMES_API_PORT || 3600);
      startHttpServer(port);
    } else {
      Logger.logError(`Failed to connect to database`);
    }
  });
});

client.login(token);