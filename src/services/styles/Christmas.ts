import { CardDecorationEnum } from "../../interfaces/enums/application/CardDecorationEnum";
import { LanguageEnum, StylePriorityEnum, StyleSlotEnum, StyleIdEnum } from "../../interfaces/enums";
import { StylePresetModule } from "../../interfaces/domain/StylePreset";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";

export default {
    config: {
        id: StyleIdEnum.CHRISTMAS,
        name: new MultiLingualString({
            [LanguageEnum.EN]: "Christmas",
            [LanguageEnum.NL]: "Kerst",
            [LanguageEnum.ES]: "Navidad",
            [LanguageEnum.DE]: "Weihnachten",
            [LanguageEnum.PT]: "Natal",
        }),
        windows: [{ from: { month: 12, day: 15 }, to: { month: 1, day: 2 } }],
        priority: StylePriorityEnum.SEASONAL,
        theme: {
            accentColor: 0xc0392b,
            card: {
                palette: { deep: '#0b2418', base: '#14402b', mid: '#1f6b43', accent: '#e74c3c', accent2: '#2fa36b', textMuted: '#bfdccb', textFaint: '#7fa890' },
                decorations: [CardDecorationEnum.SNOWFALL, CardDecorationEnum.LIGHT_STRING, CardDecorationEnum.SNOW_DRIFT],
            },
            emojis: {
                [StyleSlotEnum.ACCEPT]: '🎁',
                [StyleSlotEnum.WIN]: '🎄',
                [StyleSlotEnum.GAME_START]: '⛄',
                [StyleSlotEnum.DECORATION]: '❄️',
            },
            footer: new MultiLingualString({
                [LanguageEnum.EN]: "🎄 Deck the halls! Merry Christmas!",
                [LanguageEnum.NL]: "🎄 Zet de kerstboom maar op! Fijne kerstdagen!",
                [LanguageEnum.ES]: "🎄 ¡Decora el árbol! ¡Feliz Navidad!",
                [LanguageEnum.DE]: "🎄 Schmück den Baum! Frohe Weihnachten!",
                [LanguageEnum.PT]: "🎄 Enfeite a árvore! Feliz Natal!",
            }),
        },
    },
} as StylePresetModule;
