import { CardDecorationEnum } from "../../interfaces/enums/application/CardDecorationEnum";
import { LanguageEnum, StylePriorityEnum, StyleSlotEnum, StyleIdEnum } from "../../interfaces/enums";
import { StylePresetModule } from "../../interfaces/domain/StylePreset";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { shiftMonthDay, thanksgiving } from "../../utils/helpers/HolidayDates";

// US Thanksgiving, the 4th Thursday of November: Monday to Thursday of that week.
export default {
    config: {
        id: StyleIdEnum.THANKSGIVING,
        name: new MultiLingualString({
            [LanguageEnum.EN]: "Thanksgiving",
            [LanguageEnum.NL]: "Thanksgiving",
            [LanguageEnum.ES]: "Acción de Gracias",
            [LanguageEnum.DE]: "Thanksgiving",
            [LanguageEnum.PT]: "Dia de Ação de Graças",
        }),
        languages: [LanguageEnum.EN],
        windows: year => [{ from: shiftMonthDay(year, thanksgiving(year), -3), to: thanksgiving(year) }],
        priority: StylePriorityEnum.SEASONAL,
        theme: {
            accentColor: 0xd35400,
            card: {
                palette: { deep: '#1f1006', base: '#3a1f0c', mid: '#5c3314', accent: '#e67e22', accent2: '#c0392b', textMuted: '#ecd3b8', textFaint: '#a98563' },
                decorations: [CardDecorationEnum.FALLING_LEAVES],
            },
            emojis: {
                [StyleSlotEnum.ACCEPT]: '🦃',
                [StyleSlotEnum.WIN]: '🥧',
                [StyleSlotEnum.GAME_START]: '🍂',
                [StyleSlotEnum.DECORATION]: '🍁',
            },
            footer: new MultiLingualString({
                [LanguageEnum.EN]: "🦃 Save room for pie! Happy Thanksgiving!",
                [LanguageEnum.NL]: "🦃 Laat ruimte over voor de taart! Fijne Thanksgiving!",
                [LanguageEnum.ES]: "🦃 ¡Guarda sitio para el pastel! ¡Feliz Día de Acción de Gracias!",
                [LanguageEnum.DE]: "🦃 Lass Platz für den Kuchen! Schönes Thanksgiving!",
                [LanguageEnum.PT]: "🦃 Guarde espaço para a tarte! Feliz Dia de Ação de Graças!",
            }),
        },
    },
} as StylePresetModule;
