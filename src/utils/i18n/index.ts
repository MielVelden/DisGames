import { Language } from "../../interfaces/application/Language";
import { I18n, I18nTranslations } from "./i18n";
import { nlTranslations } from "./nl-NL";
import { enTranslations } from "./en-EN";
import { ServerModel } from "../../interfaces/domain/Server";

I18n.registerTranslations(Language.NL, nlTranslations);
I18n.registerTranslations(Language.EN, enTranslations);

export function getI18n(server: ServerModel): I18nTranslations {
    return I18n.get(server.language);
}

export { I18n, type I18nTranslations } from "./i18n"; 