import { GatewayIntentBits } from 'discord.js';
import { TOKEN } from './config';
import { DiscordClient } from './interfaces/application/DiscordClient';
import { loadEvents } from './utils/Events';
import { loadCommands } from './utils/Commands';
import { createConnectionAsync } from './repositories/util/ConnectionHandler';

const token = TOKEN;
if (!token) {
  console.error('No Discord token found in .env file!');
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
  console.log(`[INFO] Logged in as ${client.user?.tag}`);
  await createConnectionAsync().then(async (success) => {
    if (success) {
      await loadCommands(client);
      await loadEvents(client);
    } else {
      console.error(`[ERROR] Failed to connect to database`);
    }
  });
});

client.login(token);