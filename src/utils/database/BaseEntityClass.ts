import { BaseEntity } from '../../interfaces/database/BaseEntity';
import { ExceptionEnum, TableEnum } from '../../interfaces/enums';
import { ErrorHelper } from '../application/Error';
import { getEnumProperty } from '../helpers/EnumMetadata';
import { MetadataKeyEnum } from '../../interfaces/enums/application/MetadataKeyEnum';

type EnumValues<T> = T[keyof T];

export abstract class BaseEntityClass<FieldEnum = Record<string, string>> implements BaseEntity {
  Id?: number;
  protected static fieldEnum: Record<string, string> | undefined;
  protected static fieldToPropertyMap?: Record<string, string>;
  protected static tableEnum: TableEnum;

  constructor(data: BaseEntity) {
    this.Id = data.Id;
  }

  isUpdate(): boolean {
    return this.Id !== undefined && this.Id !== 0;
  }

  getId(): number | undefined {
    return this.Id;
  }

  getExternalId(): string | number | undefined {
    const tableEnum = (this.constructor as typeof BaseEntityClass).tableEnum;
    const fieldEnum = (this.constructor as typeof BaseEntityClass).fieldEnum;
    if (!fieldEnum || !tableEnum)
      return undefined;

    const externalIdField = getEnumProperty(TableEnum, tableEnum, MetadataKeyEnum.ExternalIdField);
    if (!externalIdField)
      return undefined;

    const fieldName = String(externalIdField);
    return (this as any)[fieldName];
  }

  private getFieldValue(field: EnumValues<FieldEnum>): any {
    const fieldEnum = (this.constructor as typeof BaseEntityClass).fieldEnum;
    if (!fieldEnum)
      ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);

    const fieldName = String(field);
    if (!Object.values(fieldEnum).includes(fieldName))
      ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);

    const fieldToPropertyMap = (this.constructor as typeof BaseEntityClass).fieldToPropertyMap;
    const propertyName = fieldToPropertyMap?.[fieldName] ?? fieldName;
    return (this as any)[propertyName];
  }

  private setFieldValue(field: EnumValues<FieldEnum>, value: any): void {
    const fieldEnum = (this.constructor as typeof BaseEntityClass).fieldEnum;
    if (!fieldEnum)
      ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);

    const fieldName = String(field);
    if (!Object.values(fieldEnum).includes(fieldName))
      ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);

    const fieldToPropertyMap = (this.constructor as typeof BaseEntityClass).fieldToPropertyMap;
    const propertyName = fieldToPropertyMap?.[fieldName] ?? fieldName;
    (this as any)[propertyName] = value;
  }

  validateIsNull(field: EnumValues<FieldEnum>, defaultValue?: any): void {
    const value = this.getFieldValue(field);

    if (value === null || value === undefined)
      return;

    if (defaultValue !== null && defaultValue !== undefined)
      return this.setFieldValue(field, defaultValue);

    ErrorHelper.throwWithParameters(ExceptionEnum.FIELD_IS_NULL, { field: String(field) });
  }

  validateIsNotNull<K extends keyof this | EnumValues<FieldEnum>>(field: K, defaultValue?: K extends keyof this ? this[K] : any): K extends keyof this ? NonNullable<this[K]> : void {
    const value = this.getFieldValue(field as EnumValues<FieldEnum>);

    if (value !== null && value !== undefined)
      return value as K extends keyof this ? NonNullable<this[K]> : void;

    if (defaultValue !== null && defaultValue !== undefined) {
      this.setFieldValue(field as EnumValues<FieldEnum>, defaultValue);
      return defaultValue as K extends keyof this ? NonNullable<this[K]> : void;
    }

    ErrorHelper.throwWithParameters(ExceptionEnum.FIELD_IS_NULL, { field: String(field) });
  }

  validateIsProvidedAndNotNull(field: EnumValues<FieldEnum>): void {
    const value = this.getFieldValue(field);
    if (value === null || value === undefined)
      ErrorHelper.throwWithParameters(ExceptionEnum.FIELD_IS_NULL, { field: String(field) });
  }

  validateHasNotChanged(field: EnumValues<FieldEnum>, value: any): void {
    const currentValue = this.getFieldValue(field);
    if (currentValue === null || currentValue === undefined)
      return; // Field is not set, so it has not changed

    if (currentValue !== value)
      ErrorHelper.throw(ExceptionEnum.FIELD_HAS_CHANGED);
  }
}
