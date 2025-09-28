import { createMultiLingualString, MultiLingualString } from "../interfaces/application/MultiLangualString";

export function createBlockList(items: string[]): MultiLingualString {
    return createMultiLingualString(items.map(item => `\`${item}\``).join());
}

export function createTitle(title: MultiLingualString): MultiLingualString {
    return createMultiLingualString(`## ${title}`);
}

export function createSubtitle(subtitle: MultiLingualString): MultiLingualString {
    return createMultiLingualString(`##${subtitle}`);
}

export function createBold(text: MultiLingualString): MultiLingualString {
    return createMultiLingualString(`**${text}**`);
}