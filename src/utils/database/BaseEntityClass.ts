import { BaseEntity } from '../../interfaces/database/BaseEntity';
import { ExceptionEnum, TableEnum } from '../../interfaces/enums';
import { ErrorHelper } from '../application/Error';
import { getEnumProperty } from '../helpers/EnumMetadata';
import { EnumValue, MetadataKeyEnum } from '../../interfaces/enums/application/MetadataKeyEnum';

type EnumValues<T> = T[keyof T];

export abstract class BaseEntityClass<FieldEnum = Record<string, string>> implements BaseEntity {
  Id?: number;
  protected static fieldEnum: Record<string, string> | undefined;
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

    return (this as any)[fieldName];
  }

  validateIsNull(field: EnumValues<FieldEnum>): void {
    const value = this.getFieldValue(field);
    if (value !== null && value !== undefined)
      ErrorHelper.throw(ExceptionEnum.FIELD_IS_NULL);
  }

  validateIsNotNull(field: EnumValues<FieldEnum>): void {
    const value = this.getFieldValue(field);
    if (value === null || value === undefined)
      ErrorHelper.throw(ExceptionEnum.FIELD_IS_NULL);
  }

  validateIsProvidedAndNotNull(field: EnumValues<FieldEnum>): void {
    const value = this.getFieldValue(field);
    if (value === null || value === undefined)
      ErrorHelper.throw(ExceptionEnum.FIELD_IS_NULL);
  }

  validateHasNotChanged(field: EnumValues<FieldEnum>, value: any): void {
    const currentValue = this.getFieldValue(field);
    if (currentValue === null || currentValue === undefined)
      return; // Field is not set, so it has not changed

    if (currentValue !== value)
      ErrorHelper.throw(ExceptionEnum.FIELD_HAS_CHANGED);
  }
}

