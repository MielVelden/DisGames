import { ShouldAnnounce } from '../../../utils/helpers/EnumMetadata';

export enum TimelineTypeEnum {
    GAME_CREATED = 1,
    GAME_UPDATED,
    GAME_PLAYED,
    GAME_DELETED,
    USER_CREATED,
    USER_UPDATED,
    SERVER_CREATED,
    SERVER_UPDATED,
    POINTS_ADDED,
    GAME_RESET,
}

ShouldAnnounce(TimelineTypeEnum, TimelineTypeEnum.GAME_RESET);
ShouldAnnounce(TimelineTypeEnum, TimelineTypeEnum.GAME_CREATED);
ShouldAnnounce(TimelineTypeEnum, TimelineTypeEnum.GAME_PLAYED);
ShouldAnnounce(TimelineTypeEnum, TimelineTypeEnum.GAME_RESET);