import 'dotenv/config';
import { Duration, DurationEnum, calculateDuration } from './utils/Duration';

export const TOKEN = process.env.TOKEN;
export const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export const DEBUG_MODE = process.env.DEBUG_MODE === 'true';
export const REPOSITORY_CACHE_TTL: Duration = calculateDuration(5, DurationEnum.MINUTE);
