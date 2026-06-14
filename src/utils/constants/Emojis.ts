import { Servers_Settings } from "../../interfaces/domain/Servers_Settings";

export const DEFAULT_ACCEPT_EMOJI = '✅';
export const DEFAULT_WRONG_ANSWER_EMOJI = '❌';

export function getAcceptEmoji(settings?: Servers_Settings): string {
    return settings?.defaultAcceptEmoji ?? DEFAULT_ACCEPT_EMOJI;
}

export function getRejectEmoji(settings?: Servers_Settings): string {
    return settings?.defaultRejectEmoji ?? DEFAULT_WRONG_ANSWER_EMOJI;
}

// Valid values: a single Unicode emoji grapheme cluster, or a Discord custom emoji <:name:id> / <a:name:id>.
// Digits 0-9, # and * have \p{Emoji} set but are never used as standalone reactions, so we use
// \p{Extended_Pictographic} which excludes them.
export function isValidEmoji(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return false;

    if (/^<a?:[a-zA-Z0-9_]+:\d+>$/.test(trimmed)) return true;

    const segments = [...new Intl.Segmenter().segment(trimmed)];
    if (segments.length !== 1) return false;

    const char = segments[0].segment;
    return /^\p{Extended_Pictographic}/u.test(char) ||
           /^\p{Regional_Indicator}\p{Regional_Indicator}$/u.test(char);
}
