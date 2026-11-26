import { Servers_Settings } from "../../interfaces/domain/Servers_Settings";
import StyleService from "../../services/domain/StyleService";
import { StyleSlotEnum } from "../../interfaces/enums/application/StyleSlotEnum";
import { getConfigValue } from "../application/Config";
import { EnvConfigEnum } from "../../interfaces/enums/application/EnvConfigEnum";

export const DEFAULT_ACCEPT_EMOJI = '✅';
export const DEFAULT_WRONG_ANSWER_EMOJI = '❌';

export function getDefaultPremiumEmoji(): string {
    return getConfigValue(EnvConfigEnum.DEFAULT_PREMIUM_EMOJI);
}

export function getAcceptEmoji(settings?: Servers_Settings): string {
    return settings?.defaultAcceptEmoji ?? StyleService.emoji(StyleSlotEnum.ACCEPT, DEFAULT_ACCEPT_EMOJI);
}

export function getRejectEmoji(settings?: Servers_Settings): string {
    return settings?.defaultRejectEmoji ?? StyleService.emoji(StyleSlotEnum.REJECT, DEFAULT_WRONG_ANSWER_EMOJI);
}

const VALID_EMOJI_REGEX = new RegExp(
    '^\\p{Extended_Pictographic}(\\p{Emoji_Modifier}|\\uFE0F\\u20E3?|\\u200D\\p{Extended_Pictographic}(\\p{Emoji_Modifier}|\\uFE0F)?)*$' +
    '|^\\p{Regional_Indicator}{2}$',
    'u'
);

export function isValidEmoji(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return false;
    if (/^<a?:[a-zA-Z0-9_]+:\d+>$/.test(trimmed)) return true;
    return VALID_EMOJI_REGEX.test(trimmed);
}
