import { CardDecorationEnum } from "../../interfaces/enums/application/CardDecorationEnum";
import { LanguageEnum, StylePriorityEnum, StyleSlotEnum, StyleIdEnum } from "../../interfaces/enums";
import { StylePresetModule } from "../../interfaces/domain/StylePreset";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";

export default {
    config: {
        id: StyleIdEnum.SINTERKLAAS,
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
            card: {
                palette: { deep: '#2a0a0a', base: '#4a1010', mid: '#7a1a1a', accent: '#f4c430', accent2: '#d62828', textMuted: '#ecd0b8', textFaint: '#b08c76' },
                decorations: [CardDecorationEnum.SPARKLES, CardDecorationEnum.MITRE],
            },
            emojis: {
                [StyleSlotEnum.ACCEPT]: '🎁',
                [StyleSlotEnum.WIN]: '🍪',
                [StyleSlotEnum.GAME_START]: '🥕',
                [StyleSlotEnum.DECORATION]: '👑',
            },
            footer: new MultiLingualString({
                [LanguageEnum.EN]: "🎁 Put your shoe out! Happy Sinterklaas!",
                [LanguageEnum.NL]: "🎁 Zet je schoen maar klaar! Fijne pakjesavond!",
                [LanguageEnum.ES]: "🎁 ¡Deja tu zapato listo! ¡Feliz Sinterklaas!",
                [LanguageEnum.DE]: "🎁 Stell deinen Schuh bereit! Schönes Sinterklaasfest!",
                [LanguageEnum.PT]: "🎁 Deixe o sapato pronto! Feliz Sinterklaas!",
            }),
        },
    },
} as StylePresetModule;
