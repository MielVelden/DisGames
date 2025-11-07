import { EnumValue, MetadataKeyEnum, MetadataValue } from '../../interfaces/enums/application/MetadataKeyEnum';

const enumMetadataRegistry = new Map<string, Map<MetadataKeyEnum, MetadataValue>>();

function getEnumKey(enumValue: EnumValue): string {
    return String(enumValue);
}

function ensureMetadataMap(enumValue: EnumValue): Map<MetadataKeyEnum, MetadataValue> {
    const key = getEnumKey(enumValue);
    if (!enumMetadataRegistry.has(key))
        enumMetadataRegistry.set(key, new Map());
    return enumMetadataRegistry.get(key)!;
}

export function EnumProperty<T extends EnumValue>(enumValue: EnumValue, propertyKey: MetadataKeyEnum, value: T): void {
    const metadataMap = ensureMetadataMap(enumValue);
    metadataMap.set(propertyKey, value);
}

export function getEnumProperty<T extends EnumValue>(
    key: MetadataKeyEnum,
    enumValue: T
): boolean | string | number | undefined {
    const metadataMap = enumMetadataRegistry.get(getEnumKey(enumValue));
    if (!metadataMap)
        return undefined;
    return metadataMap.get(key);
}

// Separate functions for each metadata key
export function ShouldAnnounce<T extends EnumValue>(enumValue: T): void {
    const metadataMap = ensureMetadataMap(enumValue);
    metadataMap.set(MetadataKeyEnum.ShouldAnnounce, true);
}