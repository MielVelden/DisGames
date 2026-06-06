import { SetColor, SetEmoji } from "../../../utils/helpers/EnumMetadata";

export enum BadgeEnum {
    FIRST_GAME = 1,
    DAY_STREAK = 2,
}
// TODO: Add more achievements and their metadata as needed
SetEmoji(BadgeEnum, BadgeEnum.FIRST_GAME, "🎯");
SetColor(BadgeEnum, BadgeEnum.FIRST_GAME, "#FFD700");

SetEmoji(BadgeEnum, BadgeEnum.DAY_STREAK, "🔥");
SetColor(BadgeEnum, BadgeEnum.DAY_STREAK, "#FF4500");

export enum BadgeTriggerEnum {
    BEFORE_GAME = 1,
    AFTER_GAME = 2,
}
