import { Color } from '../../../utils/helpers/Color';
import { getEnumProperty } from '../../../utils/helpers/EnumMetadata';
import { LanguageEnum } from '../../../interfaces/enums';
import { BadgeEnum } from '../../../interfaces/enums/application/BadgeEnum';
import { MetadataKeyEnum } from '../../../interfaces/enums/application/MetadataKeyEnum';
import { getMultiLingualString } from '../../../utils/i18n/MultiLingualString';
import { i18n } from '../../../utils/i18n/i18n';

export interface BadgeVisuals {
    color: Color;
    icon: string;
    title: string;
    description: string;
}

export function resolveBadgeVisuals(achievementEnum: BadgeEnum, language: LanguageEnum): BadgeVisuals {
    return {
        color: getEnumProperty(BadgeEnum, achievementEnum, MetadataKeyEnum.Color) as Color,
        icon: getEnumProperty(BadgeEnum, achievementEnum, MetadataKeyEnum.Emoji) as string,
        title: getMultiLingualString(i18n.enums.badges[achievementEnum].title, language),
        description: getMultiLingualString(i18n.enums.badges[achievementEnum].description, language),
    };
}
