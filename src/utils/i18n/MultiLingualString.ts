import { LanguageEnum } from "../../interfaces/enums/database/LanguageEnum";
import Logger from "../application/Logger";
import { LanguageTranslations } from "../../interfaces/application/i18n";

export const DEFAULT_LANGUAGE = LanguageEnum.EN;

export class MultiLingualString {
    private translations: LanguageTranslations;

    constructor(translations: LanguageTranslations, params?: Record<string, string | number>) {
        this.translations = { ...translations };
        
        if (params)
            this.replaceParameters(params);
    }

    public getMessage(language: LanguageEnum = DEFAULT_LANGUAGE): string {
        return this.translations[language] || this.translations[DEFAULT_LANGUAGE];        
    }

    public toJSON(): Record<number, string> {
        const result: Record<number, string> = {};
        
        for (const [langKey, translation] of Object.entries(this.translations)) {
            const languageEnum = parseInt(langKey) as LanguageEnum;
            if (translation && translation.trim() !== '') {
                result[languageEnum] = translation;
            }
        }
        
        return result;
    }

    public replaceParameters(parameters: { [key: string]: string | number }): void {
        if(!parameters)
            return;

        const processedTranslations = { ...this.translations };
        for (const [key, value] of Object.entries(parameters)) {
            processedTranslations[key as unknown as keyof LanguageTranslations] = processedTranslations[key as unknown as keyof LanguageTranslations]?.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)) || '';
        }

        this.translations = processedTranslations;
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
            if (Object.values(LanguageEnum).includes(languageEnum)) {
                translations[languageEnum] = translation;
            }
        }
        
        // Ensure at least the default language exists
        if (!translations[DEFAULT_LANGUAGE]) {
            const firstAvailableTranslation = Object.values(translations)[0];
            if (firstAvailableTranslation) {
                translations[DEFAULT_LANGUAGE] = firstAvailableTranslation;
            } else {
                return null;
            }
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

