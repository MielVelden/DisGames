import { createMultiLingualString, MultiLingualString } from "./i18n/MultiLangualString";

export function createBlockList(items: string[]): MultiLingualString {
    return createMultiLingualString(items.map(item => `\`${item}\``).join());
}