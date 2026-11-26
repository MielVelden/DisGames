import { CardDecorationEnum } from "../../interfaces/enums/application/CardDecorationEnum";
import { LanguageEnum, StylePriorityEnum, StyleSlotEnum, StyleIdEnum } from "../../interfaces/enums";
import { StylePresetModule } from "../../interfaces/domain/StylePreset";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";

// HOLIDAY so it wins the days it shares with Lunar New Year (2029: both on 13-14 Feb).
export default {
    config: {
        id: StyleIdEnum.VALENTINES_DAY,
        name: new MultiLingualString({
            [LanguageEnum.EN]: "Valentine's Day",
            [LanguageEnum.NL]: "Valentijnsdag",
            [LanguageEnum.ES]: "San Valentín",
            [LanguageEnum.DE]: "Valentinstag",
            [LanguageEnum.PT]: "Dia dos Namorados",
        }),
        windows: [{ from: { month: 2, day: 12 }, to: { month: 2, day: 14 } }],
        priority: StylePriorityEnum.HOLIDAY,
        theme: {
            accentColor: 0xff4d6d,
            card: {
                palette: { deep: '#24060f', base: '#3d0c1c', mid: '#65172f', accent: '#ff4d6d', accent2: '#ff8fab', textMuted: '#f3c9d4', textFaint: '#b38593' },
                decorations: [CardDecorationEnum.HEARTS],
            },
            emojis: {
                [StyleSlotEnum.ACCEPT]: '💘',
                [StyleSlotEnum.WIN]: '💖',
                [StyleSlotEnum.LOSE]: '💔',
                [StyleSlotEnum.GAME_START]: '🌹',
                [StyleSlotEnum.DECORATION]: '💕',
            },
            footer: new MultiLingualString({
                [LanguageEnum.EN]: "💘 Share the love! Happy Valentine's Day!",
                [LanguageEnum.NL]: "💘 Deel de liefde! Fijne Valentijnsdag!",
                [LanguageEnum.ES]: "💘 ¡Comparte el amor! ¡Feliz San Valentín!",
                [LanguageEnum.DE]: "💘 Teil die Liebe! Schönen Valentinstag!",
                [LanguageEnum.PT]: "💘 Partilhe o amor! Feliz Dia dos Namorados!",
            }),
        },
    },
} as StylePresetModule;
