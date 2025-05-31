import { TableEnum } from "../interfaces/enums/index";
import { getTableName, runQueryAsync } from "./util/ConnectionHandler";

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
    return results as Model[];
  }

  async Save(entity: Partial<SaveModel>): Promise<Model> {
    if (entity.Id) {
      // UPDATE
      const setClause = Object.keys(entity)
        .filter(key => key !== 'Id')
        .map(key => `${key} = ?`)
        .join(', ');

      const query = `UPDATE ${this.table} SET ${setClause} WHERE id = ?`;
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
        .map(() => '?')
        .join(', ');

      const query = `INSERT INTO ${this.table} (${keys}) VALUES (${values})`;
      const params = Object.values(entity);

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
