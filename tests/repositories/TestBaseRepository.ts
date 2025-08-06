import { TableEnum } from "../../src/interfaces/enums/index";
import BaseRepository from "../../src/repositories/BaseRepository";
import TestDatabase from "../config/TestDatabase";

interface BaseEntity {
  Id?: number;
}

class TestBaseRepository<Model extends BaseEntity, SaveModel extends BaseEntity> extends BaseRepository<Model, SaveModel> {
  
  constructor(table: TableEnum) {
    super(table);
  }

  public async Execute(): Promise<Model[]> {
    const query = this.query;
    const params = this.params;
    const hasLimit1 = this.hasLimit1;
    
    const results = await TestDatabase.runQueryAsync(query, params);
    
    this.params = [];
    this.hasLimit1 = false;
    
    if (!results) 
      return [];
    
    if (hasLimit1 && results.length > 0) {
      const firstResult = results[0] as Model;
      if (firstResult.Id) {
        const cacheManager = this.cacheManager;
        cacheManager.setCacheEntry(firstResult.Id, firstResult);
      }
    }
    
    return results as Model[];
  }

  public async Save(entity: Partial<SaveModel>): Promise<Model> {
    const table = this.tableEnum;
    
    if (entity.Id) {
      // UPDATE
      const result = await TestDatabase.updateAsync(this.tableEnum, entity.Id, entity);
      if (!result) {
        throw new Error('Record not found');
      }
      return result as Model;
    } else {
      // INSERT
      const result = await TestDatabase.insertAsync(this.tableEnum, entity);
      if (!result) {
        throw new Error('Failed to insert record');
      }
      return result as Model;
    }
  }

  public async Delete(id: number): Promise<void> {
    const table = this.table;
    const query = `DELETE FROM ${table} WHERE Id = ?`;
    await TestDatabase.runRawQueryAsync(query, [id]);
  }

  public get testDatabase(): typeof TestDatabase {
    return TestDatabase;
  }
}

export default TestBaseRepository;