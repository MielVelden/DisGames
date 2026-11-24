import { CardDecorationEnum } from "../../interfaces/enums/application/CardDecorationEnum";
import { LanguageEnum, StylePriorityEnum, StyleSlotEnum, StyleIdEnum } from "../../interfaces/enums";
import { StylePresetModule } from "../../interfaces/domain/StylePreset";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";

export default {
    config: {
        id: StyleIdEnum.ST_PATRICKS_DAY,
        name: new MultiLingualString({
            [LanguageEnum.EN]: "St. Patrick's Day",
            [LanguageEnum.NL]: "St. Patrick's Day",
            [LanguageEnum.ES]: "Día de San Patricio",
            [LanguageEnum.DE]: "St. Patrick's Day",
            [LanguageEnum.PT]: "Dia de São Patrício",
        }),
        languages: [LanguageEnum.EN],
        windows: [{ from: { month: 3, day: 15 }, to: { month: 3, day: 17 } }],
        priority: StylePriorityEnum.SEASONAL,
        theme: {
            accentColor: 0x2ecc71,
            card: {
                palette: { deep: '#04170c', base: '#0a2a17', mid: '#145028', accent: '#2ecc71', accent2: '#f4c430', textMuted: '#c4e6cf', textFaint: '#7fa98c' },
                decorations: [CardDecorationEnum.SHAMROCKS],
            },
            emojis: {
                [StyleSlotEnum.ACCEPT]: '☘️',
                [StyleSlotEnum.WIN]: '🍀',
                [StyleSlotEnum.GAME_START]: '🌈',
                [StyleSlotEnum.DECORATION]: '💚',
            },
            footer: new MultiLingualString({
                [LanguageEnum.EN]: "☘️ Wear something green! Happy St. Patrick's Day!",
                [LanguageEnum.NL]: "☘️ Trek iets groens aan! Fijne St. Patrick's Day!",
                [LanguageEnum.ES]: "☘️ ¡Vístete de verde! ¡Feliz Día de San Patricio!",
                [LanguageEnum.DE]: "☘️ Trag etwas Grünes! Schönen St. Patrick's Day!",
                [LanguageEnum.PT]: "☘️ Vista algo verde! Feliz Dia de São Patrício!",
            }),
        },
    },
} as StylePresetModule;
