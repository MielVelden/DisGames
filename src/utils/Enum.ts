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

    // Maak voor elke enum waarde een default waarde
    enumValues.forEach(enumValue => {
        result[enumValue as T[keyof T]] = defaultValue;
    });

    return result as Record<T[keyof T], any>;
}