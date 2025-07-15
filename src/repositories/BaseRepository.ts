import { TableEnum } from "../interfaces/enums/index";
import { getTableName, runQueryAsync } from "./util/ConnectionHandler";
import { MultiLingualString } from "../utils/i18n/MultiLangualString";
import { isMultiLingualString, removeMultiLingualStringSuffix } from "../utils/database/GenerateSchema";

type Condition<T> = (x: T) => any;
type QueryCondition = string | { [key: string]: any };

interface BaseEntity {
  Id?: number;
}

class BaseRepository<Model extends BaseEntity, SaveModel extends BaseEntity> {
  private table: string;
  private query: string = '';
  private params: any[] = [];

  constructor(table: TableEnum) {
    this.table = getTableName(table);
  }

  private serializeMultiLingualStrings(entity: any): any {
    if (!entity || typeof entity !== 'object') 
      return entity;
    
    const serialized = { ...entity };
    
    for (const [key, value] of Object.entries(serialized)) {
      if (value instanceof MultiLingualString) {
        serialized[key] = JSON.stringify(value.toJSON());
      }
    }
    
    return serialized;
  }

  private deserializeMultiLingualStrings(entity: any): any {
    if (!entity || typeof entity !== 'object') return entity;
    
    const deserialized = { ...entity };
    
    for (const [key, value] of Object.entries(deserialized)) {
      if (typeof value === 'string' && isMultiLingualString(key)) {
        try {
          const multiLingualString = MultiLingualString.fromJSON(value);
          if (multiLingualString) {
            deserialized[removeMultiLingualStringSuffix(key)] = multiLingualString;
          }
        } catch (error) {
          // Silently continue if parsing fails
        }
      }
    }
    
    return deserialized;
  }

  private transformDatabaseKeys(entity: any): any {
    if (!entity || typeof entity !== 'object') return entity;
    
    const transformed: any = {};
    
    for (const [key, value] of Object.entries(entity)) {
      // Transform database field names (camelCase/lowercase) to PascalCase
      const pascalCaseKey = key.charAt(0).toUpperCase() + key.slice(1);
      transformed[pascalCaseKey] = value;
    }
    
    return transformed;
  }

  Select(fields: (keyof Model)[] = ['*'] as (keyof Model)[]): BaseRepository<Model, SaveModel> {
    this.params = [];
    this.query = `SELECT ${fields.join(', ')} FROM ${this.table}`;
    return this;
  }

  Where<K extends keyof Model>(condition: Partial<Record<K, Model[K]>>): this {
    const conditions = Object.entries(condition)
      .map(([key]) => `${key} = ?`)
      .join(' AND ');

    this.query += ` WHERE ${conditions}`;
    this.params.push(...Object.values(condition));

    return this;
  }

  OrderBy(field: keyof Model, direction: 'ASC' | 'DESC' = 'ASC'): BaseRepository<Model, SaveModel> {
    this.query += ` ORDER BY ${String(field)} ${direction}`;
    return this;
  }

  OrderByRandom(): BaseRepository<Model, SaveModel> {
    this.query += ` ORDER BY RAND()`;
    return this;
  }

  Limit(count: number): BaseRepository<Model, SaveModel> {
    this.query += ` LIMIT ?`;
    this.params.push(count);
    return this;
  }

  Offset(count: number): BaseRepository<Model, SaveModel> {
    this.query += ` OFFSET ?`;
    this.params.push(count);
    return this;
  }

  async Execute(): Promise<Model[]> {
    const results = await runQueryAsync(this.query, this.params);
    this.params = [];
    
    if (!results) 
      return [];
    
    // Deserialize MultiLingualString fields
    const deserializedResults = results.map((result: any) => this.deserializeMultiLingualStrings(result));
    
    return deserializedResults as Model[];
  }

  async CallStoredProcedure(procedureName: string, params: any[] = []): Promise<Model[]> {
    const query = `CALL ${procedureName}(${params.map(() => '?').join(', ')})`;
    const results = await runQueryAsync(query, params);
    
    if (!results || !results[0]) 
      return [];
    
    // Transform database keys to PascalCase and deserialize MultiLingualString fields
    const transformedResults = results[0]
      .map((result: any) => this.transformDatabaseKeys(result))
      .map((result: any) => this.deserializeMultiLingualStrings(result));
    
    return transformedResults as Model[];
  }

  async Save(entity: Partial<SaveModel>): Promise<Model> {
    // Serialize MultiLingualString fields before saving
    const serializedEntity = this.serializeMultiLingualStrings(entity);
    
    if (serializedEntity.Id) {
      // UPDATE
      const setClause = Object.keys(serializedEntity)
        .filter(key => key !== 'Id')
        .map(key => `${key} = ?`)
        .join(', ');

      const query = `UPDATE ${this.table} SET ${setClause} WHERE id = ?`;
      const params = [...Object.values(serializedEntity).filter((_, index) => Object.keys(serializedEntity)[index] !== 'Id'), serializedEntity.Id];

      // Run the update
      await runQueryAsync(query, params);

      const result = await this.Select().Where({ Id: serializedEntity.Id }).Execute();
      if (result?.length === 0)
        throw new Error('Record not found');
      return result?.[0] as Model;
    } else {
      // INSERT
      const keys = Object.keys(serializedEntity).join(', ');
      const values = Object.values(serializedEntity)
        .map(() => '?')
        .join(', ');

      const query = `INSERT INTO ${this.table} (${keys}) VALUES (${values})`;
      const params = Object.values(serializedEntity);

      await runQueryAsync(query, params);
      
      const result = await this.Select().OrderBy('Id', 'DESC').Limit(1).Execute();
      if (result?.length === 0)
        throw new Error('Record not found');
      return result?.[0] as Model;
    }
  }

  async Delete(id: number): Promise<void> {
    const query = `DELETE FROM ${this.table} WHERE id = ?`;
    const params = [id];
    await runQueryAsync(query, params);
  }
}

export default BaseRepository;
