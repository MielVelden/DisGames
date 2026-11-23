import { LanguageEnum, StylePriorityEnum, StyleSlotEnum } from "../../interfaces/enums";
import { StylePresetModule } from "../../interfaces/domain/StylePreset";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";

export default {
    config: {
        id: 'halloween',
        name: new MultiLingualString({
            [LanguageEnum.EN]: "Halloween",
            [LanguageEnum.NL]: "Halloween",
            [LanguageEnum.ES]: "Halloween",
            [LanguageEnum.DE]: "Halloween",
            [LanguageEnum.PT]: "Halloween",
        }),
        windows: [{ from: { month: 10, day: 24 }, to: { month: 11, day: 1 } }],
        priority: StylePriorityEnum.SEASONAL,
        theme: {
            accentColor: 0xe67e22,
            cardPalette: { deep: '#140d1f', base: '#241437', mid: '#3b1f5c', accent: '#ff7518', accent2: '#8e44ad' },
            emojis: {
                [StyleSlotEnum.ACCEPT]: '🎃',
                [StyleSlotEnum.WIN]: '👻',
                [StyleSlotEnum.LOSE]: '💀',
                [StyleSlotEnum.DECORATION]: '🦇',
            },
            footer: new MultiLingualString({
                [LanguageEnum.EN]: "🎃 Spooky season!",
                [LanguageEnum.NL]: "🎃 Griezelige tijd!",
                [LanguageEnum.ES]: "🎃 ¡Temporada de miedo!",
                [LanguageEnum.DE]: "🎃 Gruselzeit!",
                [LanguageEnum.PT]: "🎃 Época de terror!",
            }),
        },
    },
} as StylePresetModule;
