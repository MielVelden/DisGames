import 'dotenv/config';
import { deployCommands } from './utils/handlers/CommandHandler';

// If this file is run directly, execute the function
if (require.main === module) {
  deployCommands().catch(console.error);
} 