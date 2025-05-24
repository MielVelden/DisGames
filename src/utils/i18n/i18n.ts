import { Language } from "../../interfaces/application/Language";

export interface I18nTranslations {
    commands: {
        save: string;
        load: string;
        delete: string;
        help: string;
    };
    messages: {
        success: string;
        error: string;
        notFound: string;
        permission: string;
    };
    errors: {
        general: string;
        invalidInput: string;
        timeout: string;
    };
}

export class I18n {
    private static translations: Map<Language, I18nTranslations> = new Map();

    static registerTranslations(language: Language, translations: I18nTranslations): void {
        this.translations.set(language, translations);
    }

    static get(language: Language): I18nTranslations {
        const translations = this.translations.get(language);
        if (!translations) {
            throw new Error(`Translations for language ${language} not found`);
        }
        return translations;
    }

    static getText(language: Language, key: keyof I18nTranslations, subKey?: string): string {
        const translations = this.get(language);
        const section = translations[key];
        
        if (subKey && typeof section === 'object' && section !== null) {
            return (section as Record<string, string>)[subKey] || `Missing translation: ${key}.${subKey}`;
        }
        
        if (typeof section === 'string') {
            return section;
        }
        
        return `Missing translation: ${key}`;
    }
}
