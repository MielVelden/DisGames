import { CardDecorationEnum } from "../../interfaces/enums/application/CardDecorationEnum";
import { LanguageEnum, StylePriorityEnum, StyleSlotEnum, StyleIdEnum } from "../../interfaces/enums";
import { StylePresetModule } from "../../interfaces/domain/StylePreset";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";

// Sits inside the Christmas window; HOLIDAY outranks SEASONAL, so it takes over for two days.
export default {
    config: {
        id: StyleIdEnum.NEW_YEARS_EVE,
        name: new MultiLingualString({
            [LanguageEnum.EN]: "New Year's Eve",
            [LanguageEnum.NL]: "Oud en Nieuw",
            [LanguageEnum.ES]: "Nochevieja",
            [LanguageEnum.DE]: "Silvester",
            [LanguageEnum.PT]: "Passagem de Ano",
        }),
        windows: [{ from: { month: 12, day: 31 }, to: { month: 1, day: 1 } }],
        priority: StylePriorityEnum.HOLIDAY,
        theme: {
            accentColor: 0xffd166,
            card: {
                palette: { deep: '#05061a', base: '#0d1033', mid: '#1c2160', accent: '#ffd166', accent2: '#6f7bff', textMuted: '#c9cdf0', textFaint: '#868bbd' },
                decorations: [CardDecorationEnum.FIREWORKS, CardDecorationEnum.CONFETTI],
            },
            emojis: {
                [StyleSlotEnum.ACCEPT]: '🥂',
                [StyleSlotEnum.WIN]: '🎆',
                [StyleSlotEnum.GAME_START]: '🎉',
                [StyleSlotEnum.DECORATION]: '✨',
            },
            footer: new MultiLingualString({
                [LanguageEnum.EN]: "🎆 Count down with us! Happy New Year!",
                [LanguageEnum.NL]: "🎆 Tel met ons af! Gelukkig nieuwjaar!",
                [LanguageEnum.ES]: "🎆 ¡Cuenta atrás con nosotros! ¡Feliz Año Nuevo!",
                [LanguageEnum.DE]: "🎆 Zähl mit uns runter! Frohes neues Jahr!",
                [LanguageEnum.PT]: "🎆 Faça a contagem decrescente connosco! Feliz Ano Novo!",
            }),
        },
    },
} as StylePresetModule;
