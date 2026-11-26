import { CardDecorationEnum } from "../../interfaces/enums/application/CardDecorationEnum";
import { LanguageEnum, StylePriorityEnum, StyleSlotEnum, StyleIdEnum } from "../../interfaces/enums";
import { StylePresetModule } from "../../interfaces/domain/StylePreset";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { easterSunday, shiftMonthDay } from "../../utils/helpers/HolidayDates";

// Dutch carnival: Sunday to Tuesday before Ash Wednesday (Easter minus 49 to 47 days).
export default {
    config: {
        id: StyleIdEnum.CARNIVAL,
        name: new MultiLingualString({
            [LanguageEnum.EN]: "Carnival",
            [LanguageEnum.NL]: "Carnaval",
            [LanguageEnum.ES]: "Carnaval",
            [LanguageEnum.DE]: "Karneval",
            [LanguageEnum.PT]: "Carnaval",
        }),
        languages: [LanguageEnum.NL],
        windows: year => [{ from: shiftMonthDay(year, easterSunday(year), -49), to: shiftMonthDay(year, easterSunday(year), -47) }],
        priority: StylePriorityEnum.CULTURAL,
        theme: {
            accentColor: 0xe63946,
            card: {
                palette: { deep: '#0f0a1f', base: '#1d1438', mid: '#33205e', accent: '#ffd60a', accent2: '#2a9d4b', textMuted: '#d8cfee', textFaint: '#9387b5' },
                decorations: [CardDecorationEnum.BUNTING, CardDecorationEnum.CONFETTI],
            },
            emojis: {
                [StyleSlotEnum.ACCEPT]: '🎭',
                [StyleSlotEnum.WIN]: '🥳',
                [StyleSlotEnum.GAME_START]: '🎺',
                [StyleSlotEnum.DECORATION]: '🎊',
            },
            footer: new MultiLingualString({
                [LanguageEnum.EN]: "🎭 Put on your costume! Happy Carnival!",
                [LanguageEnum.NL]: "🎭 Trek je carnavalspak maar aan! Alaaf, fijne carnaval!",
                [LanguageEnum.ES]: "🎭 ¡Ponte el disfraz! ¡Feliz Carnaval!",
                [LanguageEnum.DE]: "🎭 Zieh dein Kostüm an! Helau und Alaaf!",
                [LanguageEnum.PT]: "🎭 Vista a fantasia! Bom Carnaval!",
            }),
        },
    },
} as StylePresetModule;
