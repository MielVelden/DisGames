import { CardDecorationEnum } from "../../interfaces/enums/application/CardDecorationEnum";
import { LanguageEnum, StylePriorityEnum, StyleSlotEnum, StyleIdEnum } from "../../interfaces/enums";
import { StylePresetModule } from "../../interfaces/domain/StylePreset";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";

export default {
    config: {
        id: StyleIdEnum.HALLOWEEN,
        name: new MultiLingualString({
            [LanguageEnum.EN]: "Halloween",
            [LanguageEnum.NL]: "Halloween",
            [LanguageEnum.ES]: "Halloween",
            [LanguageEnum.DE]: "Halloween",
            [LanguageEnum.PT]: "Halloween",
        }),
        windows: [{ from: { month: 10, day: 24 }, to: { month: 11, day: 1 } }],
        priority: StylePriorityEnum.SEASONAL,
        theme: {
            accentColor: 0xe67e22,
            card: {
                palette: { deep: '#140d1f', base: '#241437', mid: '#3b1f5c', accent: '#ff7518', accent2: '#8e44ad', textMuted: '#cdb8e0', textFaint: '#8c72a8' },
                decorations: [CardDecorationEnum.COBWEB, CardDecorationEnum.BATS],
            },
            emojis: {
                [StyleSlotEnum.ACCEPT]: '🎃',
                [StyleSlotEnum.WIN]: '👻',
                [StyleSlotEnum.LOSE]: '💀',
                [StyleSlotEnum.DECORATION]: '🦇',
            },
            footer: new MultiLingualString({
                [LanguageEnum.EN]: "🎃 Watch out for ghosts! Happy Halloween!",
                [LanguageEnum.NL]: "🎃 Pas op voor spoken! Fijne Halloween!",
                [LanguageEnum.ES]: "🎃 ¡Cuidado con los fantasmas! ¡Feliz Halloween!",
                [LanguageEnum.DE]: "🎃 Vorsicht vor Gespenstern! Fröhliches Halloween!",
                [LanguageEnum.PT]: "🎃 Cuidado com os fantasmas! Feliz Halloween!",
            }),
        },
    },
} as StylePresetModule;
