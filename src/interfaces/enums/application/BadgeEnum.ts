import { SetColor, SetEmoji } from "../../../utils/helpers/EnumMetadata";

export enum BadgeEnum {
    FIRST_GAME = 1,
    DAY_STREAK = 2,
    GAMES_PLAYED = 3,
    POINT_COLLECTOR = 4,
    VETERAN = 5,
    WORLD_TRAVELER = 6,
}

SetEmoji(BadgeEnum, BadgeEnum.FIRST_GAME, "🎯");
SetColor(BadgeEnum, BadgeEnum.FIRST_GAME, "#FFD700");

SetEmoji(BadgeEnum, BadgeEnum.DAY_STREAK, "🔥");
SetColor(BadgeEnum, BadgeEnum.DAY_STREAK, "#FF4500");

SetEmoji(BadgeEnum, BadgeEnum.GAMES_PLAYED, "🎮");
SetColor(BadgeEnum, BadgeEnum.GAMES_PLAYED, "#4CAF50");

SetEmoji(BadgeEnum, BadgeEnum.POINT_COLLECTOR, "💎");
SetColor(BadgeEnum, BadgeEnum.POINT_COLLECTOR, "#2196F3");

SetEmoji(BadgeEnum, BadgeEnum.VETERAN, "🎖️");
SetColor(BadgeEnum, BadgeEnum.VETERAN, "#9C27B0");

SetEmoji(BadgeEnum, BadgeEnum.WORLD_TRAVELER, "🌍");
SetColor(BadgeEnum, BadgeEnum.WORLD_TRAVELER, "#FF9800");

export enum BadgeTriggerEnum {
    BEFORE_GAME = 1,
    AFTER_GAME = 2,
}
