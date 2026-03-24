import { encode, decode } from '@toon-format/toon';

export function toonEncode(data: any): string {
    return encode(data);
}

export function toonDecode(data: string): any {
    return decode(data);
}