import { createMultiLingualString, MultiLingualString } from "../i18n/MultiLingualString";

export function createBlockList(items: string[]): MultiLingualString {
    return createMultiLingualString(items.map(item => `\`${item}\``).join());
}

export function createBlock(content: string): string {
    return `\`\`\`${content}\`\`\``;
}

export function createInformationBlock(items: { key: string | MultiLingualString, value: string | MultiLingualString }[]): MultiLingualString {
    return createMultiLingualString(createBlock(items.map(item => `${item.key}: ${item.value}`).join("\n")));
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