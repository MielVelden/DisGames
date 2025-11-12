import { BaseEntity } from '../../interfaces/database/BaseEntity';
import { ExceptionEnum } from '../../interfaces/enums';
import { ErrorHelper } from '../application/Error';
import { getEnumProperty } from '../helpers/EnumMetadata';
import { MetadataKeyEnum } from '../../interfaces/enums/application/MetadataKeyEnum';

export abstract class BaseEntityClass implements BaseEntity {
  Id?: number;
  protected static fieldEnum: Record<string, string> | undefined;

  constructor(data: BaseEntity) {
    this.Id = data.Id;
  }

  getId(): number | undefined {
    return this.Id;
  }

  getExternalId(): string | number | undefined {
    const fieldEnum = (this.constructor as typeof BaseEntityClass).fieldEnum;
    if (!fieldEnum) {
      return undefined;
    }

    const externalIdField = getEnumProperty(MetadataKeyEnum.ExternalIdField, fieldEnum as Record<string, string | number>);
    if (!externalIdField) {
      return undefined;
    }

    const fieldName = String(externalIdField);
    return (this as any)[fieldName];
  }

  validateIsNull(field: string): void {
    const fieldName = String(field);
    const value = (this as any)[fieldName];
    if (value === null || value === undefined) {
      ErrorHelper.throw(ExceptionEnum.FIELD_IS_NULL);
    }
  }
}

