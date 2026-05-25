export enum MetadataKeyEnum {
    ShouldAnnounce = "ShouldAnnounce",
    ExternalIdField = "ExternalIdField",
    IsRequired = "IsRequired",
    ValidateRegex = "ValidateRegex",
    Emoji = "Emoji",
    IsRequiredInTestMode = "IsRequiredInTestMode",
    MetricType = "MetricType",
    Color = "Color",
}

export type EnumValue = string | number;
export type MetadataValue = boolean | string | number | Record<string, string | number>;