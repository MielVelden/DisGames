import { LanguageEnum, StylePriorityEnum, StyleSlotEnum } from "../../interfaces/enums";
import { StylePresetModule } from "../../interfaces/domain/StylePreset";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";

export default {
    config: {
        id: 'sinterklaas',
        name: new MultiLingualString({
            [LanguageEnum.EN]: "Sinterklaas",
            [LanguageEnum.NL]: "Sinterklaas",
            [LanguageEnum.ES]: "Sinterklaas",
            [LanguageEnum.DE]: "Sinterklaas",
            [LanguageEnum.PT]: "Sinterklaas",
        }),
        languages: [LanguageEnum.NL],
        windows: [{ from: { month: 11, day: 15 }, to: { month: 12, day: 5 } }],
        priority: StylePriorityEnum.CULTURAL,
        theme: {
            accentColor: 0xd62828,
            cardPalette: { deep: '#2a0a0a', base: '#4a1010', mid: '#7a1a1a', accent: '#f4c430', accent2: '#d62828' },
            emojis: {
                [StyleSlotEnum.ACCEPT]: '🎁',
                [StyleSlotEnum.WIN]: '🍪',
                [StyleSlotEnum.GAME_START]: '🥕',
                [StyleSlotEnum.DECORATION]: '👑',
            },
            footer: new MultiLingualString({
                [LanguageEnum.NL]: "🎁 Zet je schoen maar klaar!",
                [LanguageEnum.EN]: "🎁 Put your shoe out!",
                [LanguageEnum.ES]: "🎁 ¡Deja tu zapato listo!",
                [LanguageEnum.DE]: "🎁 Stell deinen Schuh bereit!",
                [LanguageEnum.PT]: "🎁 Deixe o sapato pronto!",
            }),
        },
    },
} as StylePresetModule;
