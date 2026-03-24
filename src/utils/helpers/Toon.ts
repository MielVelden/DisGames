export function toonEncode(data: any): string {
    return JSON.stringify(data);
}

export function toonDecode(data: string): any {
    return JSON.parse(data);
}