import { SetInDatabase } from "../../../utils/helpers/EnumMetadata";

export enum TableEnum {
    SERVERS = 1,
    GAMES = 2,
    GAME_DATA,
    POINTS,
    USERS,
    DATASHEETS,
    GAMESXDATASHEETS,
    TIMELINE_ENTRIES,
    DEBUG,
    EVENTS,
    METRICS,
    USERS_ACHIEVEMENTS,
}

SetInDatabase(TableEnum);