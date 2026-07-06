import { Image } from 'canvas';
import { Color } from '../../../utils/helpers/Color';
import { getEnumProperty } from '../../../utils/helpers/EnumMetadata';
import { LanguageEnum } from '../../../interfaces/enums';
import { BadgeEnum } from '../../../interfaces/enums/application/BadgeEnum';
import { MetadataKeyEnum } from '../../../interfaces/enums/application/MetadataKeyEnum';
import { BadgeTranslationParams, LanguageTranslations } from '../../../interfaces/application/i18n';
import { getMultiLingualString, MultiLingualString } from '../../../utils/i18n/MultiLingualString';
import { i18n } from '../../../utils/i18n/i18n';
import { loadBadgeImageAsync } from '../BadgeAsset';
import { COLOR_TEXT } from '../CardTokens';

export interface BadgeVisuals {
    color: Color;
    icon: string;
    image: Image | null;
    title: string;
    description: string;
}

type BadgeField = LanguageTranslations | ((params: Record<string, string | number>) => MultiLingualString);

const badgeThresholdParams: { [K in keyof BadgeTranslationParams]: (threshold: number) => BadgeTranslationParams[K] } = {
    [BadgeEnum.DAY_STREAK]: (threshold) => ({ days: threshold }),
    [BadgeEnum.GAMES_PLAYED]: (threshold) => ({ count: threshold }),
    [BadgeEnum.POINT_COLLECTOR]: (threshold) => ({ points: threshold }),
    [BadgeEnum.VETERAN]: (threshold) => ({ days: threshold }),
    [BadgeEnum.WORLD_TRAVELER]: (threshold) => ({ servers: threshold }),
};

function resolveBadgeField(field: BadgeField, language: LanguageEnum, params: Record<string, string | number>): string {
    return typeof field === 'function'
        ? field(params).getMessage(language)
        : getMultiLingualString(field, language);
}

export async function resolveBadgeVisuals(achievementEnum: BadgeEnum, language: LanguageEnum, level: number = 0, threshold: number = 0): Promise<BadgeVisuals> {
    const badge = i18n.enums.badges[achievementEnum];
    const paramMapper = badgeThresholdParams[achievementEnum as keyof BadgeTranslationParams];
    const params = paramMapper ? paramMapper(threshold) as Record<string, number> : {};
    return {
        color: getEnumProperty(BadgeEnum, achievementEnum, MetadataKeyEnum.Color) as Color,
        icon: getEnumProperty(BadgeEnum, achievementEnum, MetadataKeyEnum.Emoji) as string,
        image: await loadBadgeImageAsync(achievementEnum, COLOR_TEXT),
        title: resolveBadgeField(badge.title as BadgeField, language, params),
        description: resolveBadgeField(badge.description as BadgeField, language, params),
    };
}
