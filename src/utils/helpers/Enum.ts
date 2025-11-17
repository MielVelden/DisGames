import { EnumKey, EnumType, EnumValue } from "../../interfaces/application/EnumType";

export function isValidEnumValue<T extends { [key: string]: string | number }>(enumObj: T, value: string | number): boolean {
    const enumValues = Object.values(enumObj);
    return enumValues.includes(value);
}

export function getEnumValue<T extends { [key: string]: string | number }>(enumObj: T, value: string | number): T[keyof T] {
    const enumValues = Object.values(enumObj);
    return enumValues.find(v => v === value) as T[keyof T];
}

export function getEnumValueByIndex<T extends { [key: string]: string | number }>(enumObj: T, index: number): T[keyof T] {
    const enumValues = Object.values(enumObj);
    return enumValues[index-1] as T[keyof T];
}

export function getEnumDefaultsByValue<T extends { [key: string]: string | number }>(
    enumObj: T,
    defaultValue: any = 0
): Record<T[keyof T], any> {
    const result: Partial<Record<T[keyof T], any>> = {};
    const enumValues = Object.values(enumObj);

    enumValues.forEach(enumValue => {
        result[enumValue as T[keyof T]] = defaultValue;
    });

    return result as Record<T[keyof T], any>;
}

export function getEnumAsList<T extends { [key: string]: string | number }>(enumObj: T): T[keyof T][] {
    return Object.values(enumObj) as T[keyof T][];
}

export function getEnumIdentifier<T extends EnumType>(enumObject: T, enumValue: EnumValue): string {
    if (enumValue in enumObject)
        return String(enumObject[enumValue as keyof T]);
    for (const [key, val] of Object.entries(enumObject))
        if (val === enumValue)
            return key;
    return 'UnknownEnum';
}