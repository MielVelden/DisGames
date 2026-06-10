import { LanguageEnumTranslations } from "../../../interfaces/application/i18n";
import { LanguageEnum } from "../../../interfaces/enums/database/LanguageEnum";
import { UserRoleEnum } from "../../../interfaces/enums/application/UserRoleEnum";

export const userRoleTranslations: LanguageEnumTranslations<UserRoleEnum> = {
    [UserRoleEnum.ADMIN]: {
        [LanguageEnum.EN]: "Admin",
        [LanguageEnum.NL]: "Admin",
    },
    [UserRoleEnum.SYSTEM]: {
        [LanguageEnum.EN]: "System",
        [LanguageEnum.NL]: "Systeem",
    },
    [UserRoleEnum.USER]: {
        [LanguageEnum.EN]: "User",
        [LanguageEnum.NL]: "Gebruiker",
    },
};
