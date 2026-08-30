import { EnumType } from '../../interfaces/application/EnumType';
import { EnumValue, MetadataKeyEnum, MetadataValue } from '../../interfaces/enums/application/MetadataKeyEnum';
import { Color } from './Color';

const enumMetadataRegistry = new Map<string, Map<MetadataKeyEnum, MetadataValue>>();
const enumTableRegistry = new Map<EnumType, string>();
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

export function SetIsRequiredInTestMode(
    enumObject: EnumType,
    enumValue: EnumValue,
): void {
    queueRegistration(() => {
        const metadataMap = ensureMetadataMap(enumObject, enumValue);
        metadataMap.set(MetadataKeyEnum.IsRequiredInTestMode, true);
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

export function SetColor(
    enumObject: EnumType,
    enumValue: EnumValue,
    color: Color
): void {
    queueRegistration(() => {
        const metadataMap = ensureMetadataMap(enumObject, enumValue);
        metadataMap.set(MetadataKeyEnum.Color, color);
    });
}

// Every enum file in this repo is named after the enum it exports (e.g. LanguageEnum.ts
// exports LanguageEnum), so the calling file's name doubles as the enum's identifier.
function inferEnumNameFromCallSite(): string {
    const stack = new Error().stack ?? '';
    const callerLine = stack.split('\n')[3];
    const match = callerLine?.match(/([A-Za-z0-9_]+)\.(?:ts|js)/);
    if (!match)
        throw new Error(`SetInDatabase: could not infer the enum name from the call site.\n${stack}`);
    return match[1];
}

function computeEnumTableName(enumName: string): string {
    const tableName = enumName.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
    if (!tableName.endsWith('_enum'))
        throw new Error(`SetInDatabase: enum name "${enumName}" must end in "Enum" (derived table name "${tableName}" must end in "_enum")`);
    return tableName;
}

export function SetInDatabase(enumObject: EnumType): void {
    const enumName = inferEnumNameFromCallSite();
    const tableName = computeEnumTableName(enumName);
    queueRegistration(() => {
        enumTableRegistry.set(enumObject, tableName);
    });
}

export function getEnumTableRegistry(): Map<EnumType, string> {
    ensureMetadataApplied();
    return enumTableRegistry;
}
