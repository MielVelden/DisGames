import { CardDecorationEnum } from "../../interfaces/enums/application/CardDecorationEnum";
import { LanguageEnum, StylePriorityEnum, StyleSlotEnum, StyleIdEnum } from "../../interfaces/enums";
import { StylePresetModule } from "../../interfaces/domain/StylePreset";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { shiftMonthDay, thanksgiving } from "../../utils/helpers/HolidayDates";

// The day after US Thanksgiving through Cyber Monday. Shopped everywhere, so no language gate.
export default {
    config: {
        id: StyleIdEnum.BLACK_FRIDAY,
        name: new MultiLingualString({
            [LanguageEnum.EN]: "Black Friday",
            [LanguageEnum.NL]: "Black Friday",
            [LanguageEnum.ES]: "Black Friday",
            [LanguageEnum.DE]: "Black Friday",
            [LanguageEnum.PT]: "Black Friday",
        }),
        windows: year => [{ from: shiftMonthDay(year, thanksgiving(year), 1), to: shiftMonthDay(year, thanksgiving(year), 4) }],
        priority: StylePriorityEnum.SEASONAL,
        theme: {
            accentColor: 0xf4c430,
            card: {
                palette: { deep: '#050505', base: '#121212', mid: '#262626', accent: '#f4c430', accent2: '#e63946', textMuted: '#d6d6d6', textFaint: '#8c8c8c' },
                decorations: [CardDecorationEnum.PRICE_TAG],
            },
            emojis: {
                [StyleSlotEnum.ACCEPT]: '🛍️',
                [StyleSlotEnum.WIN]: '💰',
                [StyleSlotEnum.GAME_START]: '🏷️',
                [StyleSlotEnum.DECORATION]: '🖤',
            },
            footer: new MultiLingualString({
                [LanguageEnum.EN]: "🛍️ Grab the best deals! Happy Black Friday!",
                [LanguageEnum.NL]: "🛍️ Scoor de beste deals! Fijne Black Friday!",
                [LanguageEnum.ES]: "🛍️ ¡Consigue las mejores ofertas! ¡Feliz Black Friday!",
                [LanguageEnum.DE]: "🛍️ Schnapp dir die besten Deals! Schönen Black Friday!",
                [LanguageEnum.PT]: "🛍️ Aproveite as melhores promoções! Feliz Black Friday!",
            }),
        },
    },
} as StylePresetModule;
