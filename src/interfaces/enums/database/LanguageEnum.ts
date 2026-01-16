import { SetEmoji } from "../../../utils/helpers/EnumMetadata";

export enum LanguageEnum {
    EN = 1,
    NL = 2,
    ES = 3,
    DE = 4,
}

SetEmoji(LanguageEnum, LanguageEnum.EN, "🇺🇸");
SetEmoji(LanguageEnum, LanguageEnum.NL, "🇳🇱");
SetEmoji(LanguageEnum, LanguageEnum.ES, "🇪🇸");
SetEmoji(LanguageEnum, LanguageEnum.DE, "🇩🇪");