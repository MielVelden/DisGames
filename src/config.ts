import 'dotenv/config';
import { calculateDuration } from './utils/helpers/Duration';
import { Duration, DurationEnum } from './interfaces/application/Duration';

export const TOKEN = process.env.TOKEN;
export const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
export const DEBUG_DISCORD_WEBHOOK_URL = process.env.DEBUG_DISCORD_WEBHOOK_URL;

export const DEBUG_MODE = process.env.DEBUG_MODE === 'true';
export const REPOSITORY_CACHE_TTL: Duration = calculateDuration(5, DurationEnum.MINUTE);
export const ARRAY_JOIN_DELIMITER: string = "|";
export const STRING_DELIMITER: string = ";";