export interface BaseEntity {
  Id?: number;
}

export enum BaseEntityFieldType {
  String = 'String',
  Number = 'Number',
  Boolean = 'Boolean',
  Date = 'Date',
  MultiLingualString = 'MultiLingualString',
  Json = 'Json',
  Enum = "Enum",
  Unknown = "Unknown",
}