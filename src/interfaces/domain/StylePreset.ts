import { LanguageEnum } from "../enums/database/LanguageEnum";
import { StyleIdEnum } from "../enums/application/StyleIdEnum";
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

export type StyleWindows = StyleWindow[] | ((year: number) => StyleWindow[]);

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
    id: StyleIdEnum;
    name: MultiLingualString;
    languages?: LanguageEnum[];
    windows?: StyleWindows;
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
    presetId: StyleIdEnum | null;
    source: StyleSourceEnum | null;
    theme: StyleTheme;
}
