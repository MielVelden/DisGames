import { LanguageEnum } from "../enums/database/LanguageEnum";
import { StyleSlotEnum } from "../enums/application/StyleSlotEnum";
import { CardDecorationEnum } from "../enums/application/CardDecorationEnum";
import { StylePriorityEnum } from "../enums/application/StylePriorityEnum";
import { Color } from "../../utils/helpers/Color";
import { MonthDay } from "../../utils/helpers/Date";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";

export interface StyleWindow {
    from: MonthDay;
    to: MonthDay;
}

export interface CardPalette {
    deep: Color;
    base: Color;
    mid: Color;
    accent: Color;
    accent2: Color;
    textMuted?: Color;
    textFaint?: Color;
}

export interface CardTheme {
    palette: CardPalette;
    decorations?: CardDecorationEnum[];
}

export interface StyleTheme {
    accentColor?: number;
    card?: CardTheme;
    emojis?: Partial<Record<StyleSlotEnum, string>>;
    footer?: MultiLingualString;
    gameStartFlair?: MultiLingualString;
}

export interface StylePresetConfig {
    id: string;
    name: MultiLingualString;
    languages?: LanguageEnum[];
    windows?: StyleWindow[];
    priority: StylePriorityEnum;
    theme: StyleTheme;
}

export interface StylePresetModule {
    config: StylePresetConfig;
}

export enum StyleSourceEnum {
    SEASONAL = 'seasonal',
    OVERRIDE = 'override',
    // SERVER = 'server',   // future: a server picked or designed one
}

export interface ResolvedStyle {
    presetId: string | null;
    source: StyleSourceEnum | null;
    theme: StyleTheme;
}
