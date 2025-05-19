import { Client, GatewayIntentBits } from 'discord.js';
import { TOKEN } from './config';

const token = TOKEN;
if (!token) {
  console.error('No Discord token found in .env file!');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.once('ready', async () => {
  console.log(`[INFO] Logged in as ${client.user?.tag}`);
});

client.login(token);