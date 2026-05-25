import { SetColor, SetEmoji } from "../../../utils/helpers/EnumMetadata";

export enum AchievementEnum {
    FIRST_GAME = 1,
    SEVEN_DAYS_STREAK = 2,
}
// TODO: Add more achievements and their metadata as needed
SetEmoji(AchievementEnum, AchievementEnum.FIRST_GAME, "🎯");
SetColor(AchievementEnum, AchievementEnum.FIRST_GAME, "#FFD700");

SetEmoji(AchievementEnum, AchievementEnum.SEVEN_DAYS_STREAK, "🔥");
SetColor(AchievementEnum, AchievementEnum.SEVEN_DAYS_STREAK, "#FF4500");