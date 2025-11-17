export type EnumType = Record<string, string | number>;
export type EnumKey = keyof EnumType;
export type EnumValue = EnumType[EnumKey];