import { TableEnum } from "../interfaces/enums/index.js";
import { getTableName, runQueryAsync } from "./util/ConnectionHandler.js";

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

  Select(fields: (keyof Model)[] = ['*'] as (keyof Model)[]): BaseRepository<Model, SaveModel> {
    this.params = [];
    this.query = `SELECT ${fields.join(', ')} FROM ${this.table}`;
    return this;
  }

  Where<K extends keyof Model>(condition: Partial<Record<K, Model[K]>>): this {
    let counter = this.params.length;
    const conditions = Object.entries(condition)
      .map(([key, value]) => `${key} = $${++counter}`)
      .join(' AND ');

    this.query += ` WHERE ${conditions}`;
    this.params.push(...Object.values(condition));

    return this;
  }

  OrderBy(field: keyof Model, direction: 'ASC' | 'DESC' = 'ASC'): BaseRepository<Model, SaveModel> {
    this.query += ` ORDER BY ${String(field)} ${direction}`;
    return this;
  }

  Limit(count: number): BaseRepository<Model, SaveModel> {
    let counter = this.params.length;
    this.query += ` LIMIT $${++counter}`;
    this.params.push(count);
    return this;
  }

  Offset(count: number): BaseRepository<Model, SaveModel> {
    let counter = this.params.length;
    this.query += ` OFFSET $${++counter}`;
    this.params.push(count);
    return this;
  }

  async Execute(): Promise<Model[]> {
    const results = await runQueryAsync(this.query, this.params);
    this.params = [];
    return results as Model[];
  }

  async Save(entity: Partial<SaveModel>): Promise<Model> {
    if (entity.Id) {
      // UPDATE
      const setClause = Object.keys(entity)
        .filter(key => key !== 'Id')
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ');

      const query = `UPDATE ${this.table} SET ${setClause} WHERE id = $${Object.keys(entity).length}`;
      const params = [...Object.values(entity).filter((_, index) => Object.keys(entity)[index] !== 'Id'), entity.Id];

      // Run the update
      await runQueryAsync(query, params);

      const result = await this.Select().Where({ Id: entity.Id }).Execute();
      if (result?.length === 0)
        throw new Error('Record not found');
      return result?.[0] as Model;
    } else {
      // INSERT
      const keys = Object.keys(entity).join(', ');
      const values = Object.values(entity)
        .map((_, index) => `$${index + 1}`)
        .join(', ');

      const query = `INSERT INTO ${this.table} (${keys}) VALUES (${values}) RETURNING *`;
      const params = Object.values(entity);

      const result = await runQueryAsync(query, params);
      if (result?.length === 0)
        throw new Error('Record not found'); // TODO: better error message
      return result?.[0] as Model;
    }
  }
}

export default BaseRepository;
