import * as fs from 'fs';
import { DatabaseConnection } from './DatabaseConnection';
import { SchemaUtils } from './SchemaUtils';
import { JsonInterfaceValidator } from './JsonInterfaceValidator';
import { InterfaceImportManager } from './InterfaceImportManager';
import Logger from '../Logger';

export class TableInterfaceGenerator {
  private static readonly suffix = 'Model' as string;
  private static readonly saveSuffix = 'SaveModel' as string;

  private static filterDuplicateColumns(columns: any[]): any[] {
    const jsonColumns = new Set<string>();
    const nonJsonColumns = new Set<string>();
    
    // First pass: identify JSON columns and their corresponding non-JSON counterparts
    for (const column of columns) {
      if (SchemaUtils.isJsonField(column.COLUMN_NAME)) {
        const baseColumnName = SchemaUtils.removeJsonSuffix(column.COLUMN_NAME);
        jsonColumns.add(baseColumnName);
      } else {
        nonJsonColumns.add(column.COLUMN_NAME);
      }
    }
    
    // Second pass: filter out non-JSON columns that have JSON equivalents
    return columns.filter(column => {
      if (SchemaUtils.isJsonField(column.COLUMN_NAME)) {
        return true; // Always include JSON columns
      }
      
      const columnName = column.COLUMN_NAME;
      return !jsonColumns.has(columnName); // Exclude if JSON equivalent exists
    });
  }

  static async generateTableInterfaces(
    outputFilePath: string,
    enumFileLocation: string,
    enumFile: string
  ): Promise<void> {
    const connection = DatabaseConnection.getConnection();
    
    // Get all enums from the index.ts file
    const enumPaths = SchemaUtils.getExportedEnums(enumFileLocation, enumFile);
    const enumMapping = await SchemaUtils.createEnumMapping(enumFileLocation, enumPaths);

    // Get all tables in the database
    const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = ?
    `;
    const [tables] = await connection.query(tablesQuery, [DatabaseConnection.databaseName]);

    // Collect all JSON interface imports needed
    const jsonInterfaceImports = await InterfaceImportManager.collectJsonInterfaceImports(
      tables as any[], 
      connection, 
      DatabaseConnection.databaseName, 
      SchemaUtils
    );

    // Validate that all required JSON interfaces exist
    if (jsonInterfaceImports.size > 0) {
      JsonInterfaceValidator.validateJsonInterfaces(jsonInterfaceImports);
    }

    // Generate header with imports
    let interfaceContent = InterfaceImportManager.generateHeader(jsonInterfaceImports);

    for (const table of tables as any[]) {
      const tableName = table['TABLE_NAME'];

      // Get columns for table
      const columnsQuery = `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = ? 
            AND table_schema = ?
        `;
      const [columns] = await connection.query(columnsQuery, [tableName, DatabaseConnection.databaseName]);

      // Generate interface content
      interfaceContent += `export interface ${SchemaUtils.capitalize(tableName)}${this.suffix} {\n`;

      // Filter out old columns when JSON equivalent exists
      const filteredColumns = this.filterDuplicateColumns(columns as any[]);

      filteredColumns.forEach((column: any) => {
        interfaceContent += `  ${SchemaUtils.formatColumnName(column.COLUMN_NAME)}: ${SchemaUtils.mapMySQLTypeToTypescript(column.COLUMN_NAME, column.DATA_TYPE, enumMapping, tableName)};\n`;
      });

      interfaceContent += `}\n\n`;

      // Generate save models
      interfaceContent += `export interface ${SchemaUtils.capitalize(tableName)}${this.saveSuffix} {\n`;

      // Use same filtered columns for SaveModel
      filteredColumns.forEach((column: any) => {
        // For SaveModel, keep original column names (including JSON suffix) like MultiLingualString does with MLS
        const columnName = SchemaUtils.isJsonField(column.COLUMN_NAME) 
          ? column.COLUMN_NAME  // Keep SettingsJSON for save operations
          : SchemaUtils.formatColumnName(column.COLUMN_NAME);
        
        interfaceContent += `  ${columnName}?: ${SchemaUtils.mapMySQLTypeToTypescript(column.COLUMN_NAME, column.DATA_TYPE, enumMapping, tableName)};\n`;
      });

      interfaceContent += `}\n\n`;
    }

    // Write interfaces to file
    fs.writeFileSync(outputFilePath, interfaceContent);

    Logger.logInfo('Interfaces gegenereerd in ' + outputFilePath);
  }
} 