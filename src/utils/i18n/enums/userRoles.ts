import { LanguageEnumTranslations } from "../../../interfaces/application/i18n";
import { LanguageEnum } from "../../../interfaces/enums/database/LanguageEnum";
import { UserRoleEnum } from "../../../interfaces/enums/application/UserRoleEnum";

export const userRoleTranslations: LanguageEnumTranslations<UserRoleEnum> = {
    [UserRoleEnum.ADMIN]: {
        [LanguageEnum.EN]: "Admin",
        [LanguageEnum.NL]: "Admin",
        [LanguageEnum.ES]: "Admin",
        [LanguageEnum.DE]: "Admin",
        [LanguageEnum.PT]: "Admin",
    },
    [UserRoleEnum.SYSTEM]: {
        [LanguageEnum.EN]: "System",
        [LanguageEnum.NL]: "Systeem",
        [LanguageEnum.ES]: "Sistema",
        [LanguageEnum.DE]: "System",
        [LanguageEnum.PT]: "Sistema",
    },
    [UserRoleEnum.USER]: {
        [LanguageEnum.EN]: "User",
        [LanguageEnum.NL]: "Gebruiker",
        [LanguageEnum.ES]: "Usuario",
        [LanguageEnum.DE]: "Benutzer",
        [LanguageEnum.PT]: "Usuário",
    },
};
