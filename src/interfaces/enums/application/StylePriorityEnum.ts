// The numeric value IS the order: when several presets are active, the highest wins.
export enum StylePriorityEnum {
    SEASONAL = 10,   // global holidays and seasons
    HOLIDAY = 15,    // a single day inside a longer season (New Year's Eve inside Christmas)
    CULTURAL = 20,   // local traditions
}
