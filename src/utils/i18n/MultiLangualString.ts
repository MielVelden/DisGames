import { LanguageEnum } from "../../interfaces/enums/database/LanguageEnum";
import { LanguageTranslations } from "./i18n";

export const DEFAULT_LANGUAGE = LanguageEnum.EN;

export class MultiLingualString {
    private readonly translations: LanguageTranslations;

    constructor(translations: LanguageTranslations, params?: Record<string, string | number>) {
        let processedTranslations = { ...translations };
        
        if (params) {
            for (const [language, translation] of Object.entries(processedTranslations)) {
                let processedTranslation = translation;
                for (const [key, value] of Object.entries(params)) {
                    processedTranslation = processedTranslation.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
                }
                processedTranslations[language as unknown as keyof LanguageTranslations] = processedTranslation;
            }
        }
        
        this.translations = processedTranslations;
    }

    public getMessage(language: LanguageEnum = DEFAULT_LANGUAGE): string {
        return this.translations[language] || this.translations[DEFAULT_LANGUAGE];        
    }
}
