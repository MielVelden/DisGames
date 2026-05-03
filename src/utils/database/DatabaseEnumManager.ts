import { TableEnum } from '../../interfaces/enums';
import Logger from '../application/Logger';
import { runQueryAsync } from '../../repositories/util/ConnectionHandler';

export class DatabaseEnumManager {
  static async updateDatabaseWithEnums(): Promise<void> {
    const existingEnumsQuery = `
        SELECT id, LOWER(tablename) as tablename FROM table_enums;
    `;
    const existingEnumRows = await runQueryAsync(existingEnumsQuery);

    const existingEnumMap = new Map(
      (existingEnumRows as any[]).map((row: any) => [row.tablename, row.id])
    );

    for (const [tableName, enumValue] of Object.entries(TableEnum)) {
      if (typeof enumValue === 'number') {
        const lowerCaseTableName = tableName.toLowerCase();

        if (!existingEnumMap.has(lowerCaseTableName)) {
          Logger.logInfo(`Table '${lowerCaseTableName}' does not exist in 'table_enums'. Adding...`);

          await runQueryAsync(`
                    INSERT INTO table_enums (Id, TableName)
                    VALUES (?, ?)
                `, [enumValue, lowerCaseTableName]);
        } else {
          Logger.logInfo(`Table '${lowerCaseTableName}' already exists in 'table_enums' with ID ${existingEnumMap.get(lowerCaseTableName)}.`);
        }
      }
    }
    Logger.logInfo("All enums checked and added to 'table_enums' where necessary.");
  }
} 