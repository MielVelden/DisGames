import { LanguageEnum } from "../../interfaces/enums/database/LanguageEnum";
import { I18n, I18nTranslations } from "./i18n";
import { nlTranslations } from "./nl-NL";
import { enTranslations } from "./en-EN";
import { ServerModel } from "../../interfaces/domain/Server";

I18n.registerTranslations(LanguageEnum.NL, nlTranslations);
I18n.registerTranslations(LanguageEnum.EN, enTranslations);

export function getI18n(server: ServerModel): I18nTranslations {
    return I18n.get(server.language);
}

export { I18n, type I18nTranslations } from "./i18n"; 