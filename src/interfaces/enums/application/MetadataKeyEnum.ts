export enum MetadataKeyEnum {
    ShouldAnnounce = "ShouldAnnounce",
    ExternalIdField = "ExternalIdField",
    IsRequired = "IsRequired",
    ValidateRegex = "ValidateRegex",
    Emoji = "Emoji"
}

export type EnumValue = string | number;
export type MetadataValue = boolean | string | number | Record<string, string | number>;