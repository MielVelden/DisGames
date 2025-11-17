import { SetExternalIdField } from "../../../utils/helpers/EnumMetadata";
import { TableEnum } from "./TableEnum";
import { DebugModelFieldEnum, GamesModelFieldEnum, ServersModelFieldEnum, UsersModelFieldEnum } from "../../database";

SetExternalIdField(TableEnum, TableEnum.USERS, UsersModelFieldEnum.UserId);
SetExternalIdField(TableEnum, TableEnum.SERVERS, ServersModelFieldEnum.ServerId);
SetExternalIdField(TableEnum, TableEnum.GAMES, GamesModelFieldEnum.ChannelId);
SetExternalIdField(TableEnum, TableEnum.DEBUG, DebugModelFieldEnum.UniqueCode);

