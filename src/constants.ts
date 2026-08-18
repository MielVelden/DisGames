import { calculateDuration } from "./utils/helpers/Duration";
import { Duration, DurationEnum } from "./interfaces/application/Duration";

export const REPOSITORY_CACHE_TTL: Duration = calculateDuration(5, DurationEnum.MINUTE);
export const ARRAY_JOIN_DELIMITER: string = "|";
export const STRING_DELIMITER: string = ";";
export const NON_PREMIUM_GAME_LIMIT: number = 3;
