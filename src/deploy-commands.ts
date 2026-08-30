import 'reflect-metadata';
import 'dotenv/config';
import DiscordService from './services/discord/DiscordService';

// If this file is run directly, execute the function
if (require.main === module) {
  DiscordService.deployCommandsAsync().catch(console.error);
}