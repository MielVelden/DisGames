// Motifs a style preset can paint onto canvas cards. Each value has exactly one
// painter in builders/cards/CardDecorations.ts (a Record over this enum, so a new
// value will not compile until it has one).
export enum CardDecorationEnum {
    SNOWFALL = 'snowfall',
    LIGHT_STRING = 'lightString',
    SNOW_DRIFT = 'snowDrift',
    COBWEB = 'cobweb',
    BATS = 'bats',
    SPARKLES = 'sparkles',
    MITRE = 'mitre',
}
