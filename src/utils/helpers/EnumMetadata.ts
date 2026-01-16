import { EnumType } from '../../interfaces/application/EnumType';
import { EnumValue, MetadataKeyEnum, MetadataValue } from '../../interfaces/enums/application/MetadataKeyEnum';

const enumMetadataRegistry = new Map<string, Map<MetadataKeyEnum, MetadataValue>>();
const pendingRegistrations: Array<() => void> = [];

let registrationsApplied: boolean = false;

function getEnumIdentifier<T extends EnumType>(enumObject: T, enumValue: EnumValue): string {
    if (enumValue in enumObject)
        return String(enumObject[enumValue as keyof T]);
    for (const [key, val] of Object.entries(enumObject))
        if (val === enumValue)
            return key;
    return 'UnknownEnum';
}

function getEnumKey<T extends EnumType>(enumObject: T, enumValue: EnumValue): string {
    const enumIdentifier = getEnumIdentifier(enumObject, enumValue);
    return String(enumIdentifier) + ";" + String(enumValue);
}

function ensureMetadataMap(
    enumObject: EnumType,
    enumValue: EnumValue,
): Map<MetadataKeyEnum, MetadataValue> {
    const key = getEnumKey(enumObject, enumValue);
    if (!enumMetadataRegistry.has(key))
        enumMetadataRegistry.set(key, new Map());
    return enumMetadataRegistry.get(key)!;
}

function queueRegistration(registration: () => void): void {
    if (registrationsApplied) {
        registration();
        return;
    }
    pendingRegistrations.push(registration);
}

function applyRegistrations(): void {
    if (registrationsApplied)
        return;

    registrationsApplied = true;
    pendingRegistrations.splice(0).forEach(registration => registration());
}

export function ensureMetadataApplied(): void {
    applyRegistrations();
}

export function EnumProperty<T extends EnumValue>(
    enumObject: EnumType,
    enumValue: EnumValue,
    propertyKey: MetadataKeyEnum,
    value: T,
): void {
    queueRegistration(() => {
        const metadataMap = ensureMetadataMap(enumObject, enumValue);
        metadataMap.set(propertyKey, value);
    });
}

export function getEnumProperty(
    enumObject: EnumType,
    enumValue: EnumValue,
    propertyKey: MetadataKeyEnum
): MetadataValue | undefined {
    ensureMetadataApplied();

    const metadataMap = enumMetadataRegistry.get(getEnumKey(enumObject, enumValue));
    if (!metadataMap)
        return undefined;
    return metadataMap.get(propertyKey);
}

// Separate functions for each metadata key
export function ShouldAnnounce(enumObject: EnumType, enumValue: EnumValue): void {
    queueRegistration(() => {
        const metadataMap = ensureMetadataMap(enumObject, enumValue);
        metadataMap.set(MetadataKeyEnum.ShouldAnnounce, true);
    });
}

export function SetExternalIdField(
    enumObject: EnumType,
    enumValue: EnumValue,
    modelFieldEnum: EnumValue
): void {
    queueRegistration(() => {
        const metadataMap = ensureMetadataMap(enumObject, enumValue);
        metadataMap.set(MetadataKeyEnum.ExternalIdField, modelFieldEnum);
    });
}

export function SetIsRequired(
    enumObject: EnumType,
    enumValue: EnumValue,
): void {
    queueRegistration(() => {
        const metadataMap = ensureMetadataMap(enumObject, enumValue);
        metadataMap.set(MetadataKeyEnum.IsRequired, true);
    });
}

export function SetValidateRegex(
    enumObject: EnumType,
    enumValue: EnumValue,
    regex: RegExp
): void {
    queueRegistration(() => {
        const metadataMap = ensureMetadataMap(enumObject, enumValue);
        metadataMap.set(MetadataKeyEnum.ValidateRegex, regex.source);
    });
}

export function SetEmoji(
    enumObject: EnumType,
    enumValue: EnumValue,
    emoji: string
): void {
    queueRegistration(() => {
        const metadataMap = ensureMetadataMap(enumObject, enumValue);
        metadataMap.set(MetadataKeyEnum.Emoji, emoji);
    });
}