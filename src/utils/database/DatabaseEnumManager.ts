import { TableEnum } from '../../interfaces/enums';
import { DatabaseConnection } from './DatabaseConnection';
import Logger from '../application/Logger';

export class DatabaseEnumManager {
  static async updateDatabaseWithEnums(): Promise<void> {
    const connection = DatabaseConnection.getConnection();
    
    // Get all existing enums from 'table_enums'
    const existingEnumsQuery = `
        SELECT id, LOWER(tablename) as tablename FROM table_enums;
    `;
    const [existingEnumRows] = await connection.query(existingEnumsQuery);

    // Create a map of existing enums
    const existingEnumMap = new Map(
      (existingEnumRows as any[]).map((row: any) => [row.tablename, row.id])
    );

    // Loop through all enums in TableEnum
    for (const [tableName, enumValue] of Object.entries(TableEnum)) {
      if (typeof enumValue === 'number') {
        const lowerCaseTableName = tableName.toLowerCase();

        // Check if the enum exists in 'table_enums'
        if (!existingEnumMap.has(lowerCaseTableName)) {
          Logger.logInfo(`Table '${lowerCaseTableName}' does not exist in 'table_enums'. Adding...`);

          // Add the enum to 'table_enums'
          await connection.query(`
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