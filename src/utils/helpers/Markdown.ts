import { isMultiLingualString } from "../../interfaces/application";
import { LanguageTranslations } from "../../interfaces/application/i18n";
import { LanguageEnum } from "../../interfaces/enums/database/LanguageEnum";
import { createMultiLingualString, MultiLingualString } from "../i18n/MultiLingualString";

function resolveForKeyOrValue(item: string | MultiLingualString, lang: LanguageEnum): string {
    if (typeof item === "string")
        return item;
    return item.getMessage(lang);
}

export function createBlockList(items: string[]): MultiLingualString {
    return createMultiLingualString(items.map(item => `\`${item}\``).join());
}

export function createBlock(content: string): string;
export function createBlock(content: MultiLingualString): MultiLingualString;
export function createBlock(content: string | MultiLingualString): string | MultiLingualString {
    if (isMultiLingualString(content))
        return content.changeText((text) => `\`\`\`${text}\`\`\``);
    return `\`\`\`${content}\`\`\``;
}

export function createInformationBlock(items: { key: string | MultiLingualString, value: string | MultiLingualString }[]): MultiLingualString {
    const translations: LanguageTranslations = {} as LanguageTranslations;
    for (const lang of [LanguageEnum.EN, LanguageEnum.NL]) {
        const blockText = items.map(item => `${resolveForKeyOrValue(item.key, lang)}: ${resolveForKeyOrValue(item.value, lang)}`).join("\n");
        translations[lang] = `\`\`\`${blockText}\`\`\``;
    }
    return new MultiLingualString(translations);
}

export function createTitle(title: string | MultiLingualString, emoji?: string): MultiLingualString {
    if (isMultiLingualString(title))
        return title.changeText((text) => `## ${emoji ? `${emoji} ` : ''}${text}`);
    return createMultiLingualString(`## ${emoji ? `${emoji} ` : ''}${title}`);
}

export function createSubtitle(subtitle: MultiLingualString): MultiLingualString {
    return subtitle.changeText((text) => `## ${text}`);
}

export function createFooter(footer: string | MultiLingualString): MultiLingualString {
    if (isMultiLingualString(footer))
        return footer.changeText((text) => `-# ${text}`);
    return createMultiLingualString(`-# ${footer}`);
}

export function createBold(text: MultiLingualString): MultiLingualString {
    return text.changeText((t) => `**${t}**`);
}

export function addPrefix(text: MultiLingualString, prefix: string): MultiLingualString {
    return text.changeText((t) => `${prefix} ${t}`);
}

export function addSuffix(text: MultiLingualString, suffix: string): MultiLingualString {
    return text.changeText((t) => `${t} ${suffix}`);
}