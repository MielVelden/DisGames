import { LanguageEnum } from "../../interfaces/enums/database/LanguageEnum";
import Logger from "../application/Logger";
import { LanguageTranslations } from "../../interfaces/application/i18n";
import { getCurrentLanguage } from "../../middleware/EventContext";
import { humanizeDate, isDate } from "../helpers/Date";

export const DEFAULT_LANGUAGE = LanguageEnum.EN;

export class MultiLingualString {
    private translations: LanguageTranslations;

    constructor(translations: LanguageTranslations, params?: Record<string, string | number | Date>) {
        this.translations = { ...translations };

        if (params)
            this.replaceParameters(params);
    }

    public getMessage(language?: LanguageEnum): string {
        const targetLanguage = language ?? getCurrentLanguage() ?? DEFAULT_LANGUAGE;
        return this.translations[targetLanguage] || this.translations[DEFAULT_LANGUAGE];
    }

    public toJSON(): Record<number, string> {
        const result: Record<number, string> = {};

        for (const [langKey, translation] of Object.entries(this.translations)) {
            const languageEnum = parseInt(langKey) as LanguageEnum;
            if (translation && translation.trim() !== '')
                result[languageEnum] = translation;
        }

        return result;
    }

    public changeText(fn: (text: string) => string): MultiLingualString {
        const result: LanguageTranslations = {} as LanguageTranslations;
        for (const [langKey, translation] of Object.entries(this.translations)) {
            if (translation !== undefined)
                result[parseInt(langKey) as keyof LanguageTranslations] = fn(translation);
        }
        return new MultiLingualString(result);
    }

    public replaceParameters(parameters: { [key: string]: string | number | Date }): void {
        if (!parameters)
            return;

        const processedTranslations = { ...this.translations };
        for (const [langKey, translation] of Object.entries(processedTranslations)) {
            if (translation) {
                let processedTranslation = translation;

                for (const [paramKey, paramValue] of Object.entries(parameters)) {
                    let processedParamValue = paramValue;
                    if (isDate(paramValue))
                        processedParamValue = humanizeDate(paramValue);
                    
                    processedTranslation = processedTranslation.replace(
                        new RegExp(`\\{${paramKey}\\}`, 'g'),
                        String(processedParamValue)
                    );
                }

                processedTranslations[parseInt(langKey) as keyof LanguageTranslations] = processedTranslation;
            }
        }

        this.translations = processedTranslations;
    }

    public static combine(strings: MultiLingualString[], separator: string = '\n'): MultiLingualString {
        const keys = new Set<number>();
        for (const s of strings) {
            Object.keys(s.toJSON()).forEach(k => keys.add(parseInt(k)));
        }

        const combined: Record<number, string> = {};
        for (const key of keys) {
            const parts = strings
                .map(s => s.toJSON()[key])
                .filter((t): t is string => t != null && t.trim() !== '');
            combined[key] = parts.join(separator);
        }
        
        return MultiLingualString.fromJSON(combined) ?? new MultiLingualString({} as LanguageTranslations);
    }

    public static fromJSON(json: string | Record<number, string> | null): MultiLingualString | null {
        if (!json) return null;

        let data: Record<number, string>;

        if (typeof json === 'string') {
            try {
                data = JSON.parse(json);
            } catch (error) {
                Logger.logWarning(`Failed to parse MultiLingualString JSON: ${error as Error}`);
                return null;
            }
        } else {
            data = json;
        }

        const translations: LanguageTranslations = {} as LanguageTranslations;

        for (const [langKey, translation] of Object.entries(data)) {
            const languageEnum = parseInt(langKey) as LanguageEnum;
            if (Object.values(LanguageEnum).includes(languageEnum))
                translations[languageEnum] = translation;
        }

        // Ensure at least the default language exists
        if (!translations[DEFAULT_LANGUAGE]) {
            const firstAvailableTranslation = Object.values(translations)[0];
            if (firstAvailableTranslation)
                translations[DEFAULT_LANGUAGE] = firstAvailableTranslation;
            else
                return null;
        }

        return new MultiLingualString(translations);
    }
}

export function createMultiLingualString(message: string): MultiLingualString {
    return new MultiLingualString({
        [LanguageEnum.EN]: message,
        [LanguageEnum.NL]: message
    });
}

export function getMultiLingualString(message: LanguageTranslations, language: LanguageEnum): string {
    const multiLingualString = new MultiLingualString(message);
    return multiLingualString.getMessage(language);
}