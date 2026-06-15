import { SetEmoji, SetIsRequired } from "../../../utils/helpers/EnumMetadata";

export enum LanguageEnum {
    EN = 1,
    NL = 2,
    ES = 3,
    DE = 4,
    PT = 5,
}

SetIsRequired(LanguageEnum, LanguageEnum.EN);
SetIsRequired(LanguageEnum, LanguageEnum.NL);
SetIsRequired(LanguageEnum, LanguageEnum.ES);
SetIsRequired(LanguageEnum, LanguageEnum.DE);

SetEmoji(LanguageEnum, LanguageEnum.EN, "🇺🇸");
SetEmoji(LanguageEnum, LanguageEnum.NL, "🇳🇱");
SetEmoji(LanguageEnum, LanguageEnum.ES, "🇪🇸");
SetEmoji(LanguageEnum, LanguageEnum.DE, "🇩🇪");
SetEmoji(LanguageEnum, LanguageEnum.PT, "🇵🇹");