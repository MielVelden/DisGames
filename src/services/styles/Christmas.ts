import { LanguageEnum, StylePriorityEnum, StyleSlotEnum } from "../../interfaces/enums";
import { StylePresetModule } from "../../interfaces/domain/StylePreset";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";

export default {
    config: {
        id: 'christmas',
        name: new MultiLingualString({
            [LanguageEnum.EN]: "Christmas",
            [LanguageEnum.NL]: "Kerst",
            [LanguageEnum.ES]: "Navidad",
            [LanguageEnum.DE]: "Weihnachten",
            [LanguageEnum.PT]: "Natal",
        }),
        windows: [{ from: { month: 12, day: 15 }, to: { month: 1, day: 2 } }],
        priority: StylePriorityEnum.SEASONAL,
        theme: {
            accentColor: 0xc0392b,
            cardPalette: { deep: '#0f2a1d', base: '#14402b', mid: '#1f6b43', accent: '#e74c3c', accent2: '#f1c40f' },
            emojis: {
                [StyleSlotEnum.ACCEPT]: '🎁',
                [StyleSlotEnum.WIN]: '🎄',
                [StyleSlotEnum.GAME_START]: '⛄',
                [StyleSlotEnum.DECORATION]: '❄️',
            },
            footer: new MultiLingualString({
                [LanguageEnum.EN]: "🎄 Happy holidays!",
                [LanguageEnum.NL]: "🎄 Fijne feestdagen!",
                [LanguageEnum.ES]: "🎄 ¡Felices fiestas!",
                [LanguageEnum.DE]: "🎄 Frohe Feiertage!",
                [LanguageEnum.PT]: "🎄 Boas festas!",
            }),
        },
    },
} as StylePresetModule;
