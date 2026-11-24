import { CardDecorationEnum } from "../../interfaces/enums/application/CardDecorationEnum";
import { LanguageEnum, StylePriorityEnum, StyleSlotEnum, StyleIdEnum } from "../../interfaces/enums";
import { StylePresetModule } from "../../interfaces/domain/StylePreset";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { easterSunday, shiftMonthDay } from "../../utils/helpers/HolidayDates";

// Good Friday to Easter Monday (Western Easter).
export default {
    config: {
        id: StyleIdEnum.EASTER,
        name: new MultiLingualString({
            [LanguageEnum.EN]: "Easter",
            [LanguageEnum.NL]: "Pasen",
            [LanguageEnum.ES]: "Pascua",
            [LanguageEnum.DE]: "Ostern",
            [LanguageEnum.PT]: "Páscoa",
        }),
        windows: year => [{ from: shiftMonthDay(year, easterSunday(year), -2), to: shiftMonthDay(year, easterSunday(year), 1) }],
        priority: StylePriorityEnum.SEASONAL,
        theme: {
            accentColor: 0xf9c74f,
            card: {
                palette: { deep: '#0f1f2a', base: '#1b3344', mid: '#2c5066', accent: '#f9c74f', accent2: '#90e0a0', textMuted: '#d4e4ee', textFaint: '#8aa5b6' },
                decorations: [CardDecorationEnum.EASTER_EGGS],
            },
            emojis: {
                [StyleSlotEnum.ACCEPT]: '🐣',
                [StyleSlotEnum.WIN]: '🥚',
                [StyleSlotEnum.GAME_START]: '🐰',
                [StyleSlotEnum.DECORATION]: '🌷',
            },
            footer: new MultiLingualString({
                [LanguageEnum.EN]: "🐣 Go find the eggs! Happy Easter!",
                [LanguageEnum.NL]: "🐣 Ga maar eieren zoeken! Vrolijk Pasen!",
                [LanguageEnum.ES]: "🐣 ¡Busca los huevos! ¡Felices Pascuas!",
                [LanguageEnum.DE]: "🐣 Such die Ostereier! Frohe Ostern!",
                [LanguageEnum.PT]: "🐣 Procure os ovos! Feliz Páscoa!",
            }),
        },
    },
} as StylePresetModule;
