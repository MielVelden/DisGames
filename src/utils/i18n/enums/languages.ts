import { LanguageEnumTranslations } from "../../../interfaces/application/i18n";
import { LanguageEnum } from "../../../interfaces/enums/database/LanguageEnum";

export const languageTranslations: LanguageEnumTranslations<LanguageEnum> = {
    [LanguageEnum.EN]: {
        [LanguageEnum.EN]: "English",
        [LanguageEnum.NL]: "Engels",
        [LanguageEnum.ES]: "Inglés",
        [LanguageEnum.DE]: "Englisch",
        [LanguageEnum.PT]: "Inglês",
    },
    [LanguageEnum.NL]: {
        [LanguageEnum.EN]: "Dutch",
        [LanguageEnum.NL]: "Nederlands",
        [LanguageEnum.ES]: "Holandés",
        [LanguageEnum.DE]: "Niederländisch",
        [LanguageEnum.PT]: "Holandês",
    },
    [LanguageEnum.ES]: {
        [LanguageEnum.EN]: "Spanish",
        [LanguageEnum.NL]: "Spaans",
        [LanguageEnum.ES]: "Español",
        [LanguageEnum.DE]: "Spanisch",
        [LanguageEnum.PT]: "Espanhol",
    },
    [LanguageEnum.DE]: {
        [LanguageEnum.EN]: "German",
        [LanguageEnum.NL]: "Duits",
        [LanguageEnum.ES]: "Alemán",
        [LanguageEnum.DE]: "Deutsch",
        [LanguageEnum.PT]: "Alemão",
    },
    [LanguageEnum.PT]: {
        [LanguageEnum.EN]: "Portuguese",
        [LanguageEnum.NL]: "Portugees",
        [LanguageEnum.ES]: "Portugués",
        [LanguageEnum.DE]: "Portugiesisch",
        [LanguageEnum.PT]: "Português",
    },
};
