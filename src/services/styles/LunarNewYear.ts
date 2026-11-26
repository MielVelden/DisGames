import { CardDecorationEnum } from "../../interfaces/enums/application/CardDecorationEnum";
import { LanguageEnum, StylePriorityEnum, StyleSlotEnum, StyleIdEnum } from "../../interfaces/enums";
import { StylePresetModule } from "../../interfaces/domain/StylePreset";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { lunarNewYear, shiftMonthDay } from "../../utils/helpers/HolidayDates";

// New Year's Eve through the third day of the new year. Dates come from a lookup table.
export default {
    config: {
        id: StyleIdEnum.LUNAR_NEW_YEAR,
        name: new MultiLingualString({
            [LanguageEnum.EN]: "Lunar New Year",
            [LanguageEnum.NL]: "Chinees Nieuwjaar",
            [LanguageEnum.ES]: "Año Nuevo Lunar",
            [LanguageEnum.DE]: "Mondneujahr",
            [LanguageEnum.PT]: "Ano Novo Lunar",
        }),
        windows: year => {
            const day = lunarNewYear(year);
            return day ? [{ from: shiftMonthDay(year, day, -1), to: shiftMonthDay(year, day, 3) }] : [];
        },
        priority: StylePriorityEnum.SEASONAL,
        theme: {
            accentColor: 0xd62828,
            card: {
                palette: { deep: '#2a0505', base: '#4a0a0a', mid: '#7a1414', accent: '#f4c430', accent2: '#ff5a3c', textMuted: '#f0d2b4', textFaint: '#b38a6c' },
                decorations: [CardDecorationEnum.LANTERNS, CardDecorationEnum.SPARKLES],
            },
            emojis: {
                [StyleSlotEnum.ACCEPT]: '🧧',
                [StyleSlotEnum.WIN]: '🐉',
                [StyleSlotEnum.GAME_START]: '🏮',
                [StyleSlotEnum.DECORATION]: '🎆',
            },
            footer: new MultiLingualString({
                [LanguageEnum.EN]: "🧧 Hang up the lanterns! Happy Lunar New Year!",
                [LanguageEnum.NL]: "🧧 Hang de lampionnen maar op! Gelukkig Chinees Nieuwjaar!",
                [LanguageEnum.ES]: "🧧 ¡Cuelga los farolillos! ¡Feliz Año Nuevo Lunar!",
                [LanguageEnum.DE]: "🧧 Häng die Laternen auf! Frohes Mondneujahr!",
                [LanguageEnum.PT]: "🧧 Pendure as lanternas! Feliz Ano Novo Lunar!",
            }),
        },
    },
} as StylePresetModule;
