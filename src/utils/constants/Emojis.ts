import { Servers_Settings } from "../../interfaces/domain/Servers_Settings";

export const DEFAULT_ACCEPT_EMOJI = '✅';
export const DEFAULT_WRONG_ANSWER_EMOJI = '❌';

export function getAcceptEmoji(settings?: Servers_Settings): string {
    return settings?.defaultAcceptEmoji ?? DEFAULT_ACCEPT_EMOJI;
}

export function getRejectEmoji(settings?: Servers_Settings): string {
    return settings?.defaultRejectEmoji ?? DEFAULT_WRONG_ANSWER_EMOJI;
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
