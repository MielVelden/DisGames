import { isMultiLingualString } from "../../interfaces/application";
import { BaseEntityFieldType } from "../../interfaces/database/BaseEntity";
import { MultiLingualString } from "../i18n/MultiLingualString";
import { SchemaUtils } from "./SchemaUtils";

export class DatabaseHelper {
  
  public static serializeMultiLingualStrings<FieldEnum extends Record<string, string>>(entity: any, fieldEnum: FieldEnum, fieldTypeFunction: (field: FieldEnum[keyof FieldEnum]) => BaseEntityFieldType): any {
    if (!entity || typeof entity !== 'object') 
      return entity;
    
    const serialized = { ...entity };
    
    for (const [key, value] of Object.entries(serialized)) {
      const field = fieldEnum[key as keyof FieldEnum];
      if (isMultiLingualString(value) || fieldTypeFunction(field) === BaseEntityFieldType.MultiLingualString) {
        const dbColumnName = SchemaUtils.getMultiLingualStringColumnName(key);
        const serializedValue = isMultiLingualString(value) ? value.toJSON() : value;
        serialized[dbColumnName] = JSON.stringify(serializedValue);
        delete serialized[key];
      }
    }
    
    return serialized;
  }

  public static deserializeMultiLingualStrings(entity: any): any {
    if (!entity || typeof entity !== 'object') 
        return entity;
    
    const deserialized = { ...entity };
    
    for (const [key, value] of Object.entries(deserialized)) {
      if (typeof value === 'string' && SchemaUtils.isMultiLingualString(key)) {
        try {
          const multiLingualString = MultiLingualString.fromJSON(value);
          if (multiLingualString) {
            deserialized[SchemaUtils.removeMultiLingualStringSuffix(key)] = multiLingualString;
          }
        } catch (error) {
          // Silently continue if parsing fails
        }
      }
    }
    
    return deserialized;
  }

  public static serializeJsonFields(entity: any): any {
    if (!entity || typeof entity !== 'object') 
      return entity;
    
    const serialized = { ...entity };
    
    // First, handle non-JSON fields that have JSON equivalents
    const jsonFieldsToProcess = new Map<string, any>();
    
    for (const [key, value] of Object.entries(serialized)) {
      if (!SchemaUtils.isJsonField(key)) {
        const jsonFieldName = key + 'JSON';
        // If there's a corresponding JSON field, use the non-JSON field as the source
        if (serialized[jsonFieldName] !== undefined) {
          jsonFieldsToProcess.set(jsonFieldName, value);
          delete serialized[key]; // Remove the non-JSON field
        }
      }
    }
    
    // Process JSON fields - serialize only from their non-JSON counterparts or if they're objects
    for (const [key, value] of Object.entries(serialized)) {
      if (SchemaUtils.isJsonField(key)) {
        if (jsonFieldsToProcess.has(key)) {
          // Use the value from the non-JSON field (guaranteed to be an object)
          serialized[key] = JSON.stringify(jsonFieldsToProcess.get(key));
        } else if (value === null) {
          // Keep null values - they should be included in UPDATE queries when explicitly set
          serialized[key] = null;
        } else if (value !== undefined && typeof value !== 'string') {
          // Only serialize if it's not already a string
          serialized[key] = JSON.stringify(value);
        }
        // If it's already a string, keep it as-is (already serialized)
      }
    }
    
    return serialized;
  }

  public static deserializeJsonFields(entity: any): any {
    if (!entity || typeof entity !== 'object') 
        return entity;
    
    const deserialized = { ...entity };
    
    for (const [key, value] of Object.entries(deserialized)) {
      if (typeof value === 'string' && SchemaUtils.isJsonField(key)) {
        try {
          const parsedValue = JSON.parse(value);
          deserialized[SchemaUtils.removeJsonSuffix(key)] = parsedValue;
        } catch (error) {
          // Silently continue if parsing fails
        }
      }
    }
    
    return deserialized;
  }

  public static transformDatabaseKeys(entity: any): any {
    if (!entity || typeof entity !== 'object') 
        return entity;
    
    const transformed: any = {};
    
    for (const [key, value] of Object.entries(entity)) {
      // Transform database field names (camelCase/lowercase) to PascalCase
      const pascalCaseKey = key.charAt(0).toUpperCase() + key.slice(1);
      transformed[pascalCaseKey] = value;
    }
    
    return transformed;
  }

  public static processResultsFromDatabase(results: any[]): any[] {
    if (!results) 
      return [];
    
    // Ensure results is an array
    if (!Array.isArray(results)) {
      return [];
    }
    
    return results.map((result: any) => {
      let processed = this.deserializeMultiLingualStrings(result);
      processed = this.deserializeJsonFields(processed);
      return processed;
    });
  }

  public static processEntityForDatabase(entity: any, fieldEnum: Record<string, string>, fieldTypeFunction: (field: any) => BaseEntityFieldType): any {
    if (!entity || typeof entity !== 'object') 
        return entity;
    
    let processed = this.serializeMultiLingualStrings(entity, fieldEnum, fieldTypeFunction);
    processed = this.serializeJsonFields(processed);
    return processed;
  }

  public static processStoredProcedureResults(results: any[]): any[] {
    if (!results || !results[0]) 
        return [];
    
    // Ensure results[0] is an array
    if (!Array.isArray(results[0])) {
        return [];
    }
    
    return results[0]
      .map((result: any) => this.transformDatabaseKeys(result))
      .map((result: any) => {
        let deserialized = this.deserializeMultiLingualStrings(result);
        deserialized = this.deserializeJsonFields(deserialized);
        return deserialized;
      });
  }
}