import { SetExternalIdField } from "../../../utils/helpers/EnumMetadata";
import { DebugModelFieldEnum, GamesModelFieldEnum, ServersModelFieldEnum, UsersModelFieldEnum } from "../../database";

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
}

SetExternalIdField(UsersModelFieldEnum, UsersModelFieldEnum.UserId);
SetExternalIdField(ServersModelFieldEnum, ServersModelFieldEnum.ServerId);
SetExternalIdField(GamesModelFieldEnum, GamesModelFieldEnum.ChannelId);
SetExternalIdField(DebugModelFieldEnum, DebugModelFieldEnum.UniqueCode);