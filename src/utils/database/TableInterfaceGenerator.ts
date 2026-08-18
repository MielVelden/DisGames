import * as fs from 'fs';
import { SchemaUtils } from './SchemaUtils';
import { JsonInterfaceValidator } from './JsonInterfaceValidator';
import { InterfaceImportManager } from './InterfaceImportManager';
import Logger from '../application/Logger';
import { TableEnum } from '../../interfaces/enums/database/TableEnum';
import { getEnumValue } from '../helpers/Enum';
import { runQueryAsync, getDatabaseName } from '../../repositories/util/ConnectionHandler';

export class TableInterfaceGenerator {
  private static readonly suffix = 'Model' as string;
  private static readonly saveSuffix = 'SaveModel' as string;
  private static readonly fieldEnumSuffix = 'ModelFieldEnum' as string;
  private static readonly baseEntityFieldType = 'BaseEntityFieldType' as string;
  ;
  private static generateFieldEnum(tableName: string, columns: any[]): string {
    let enumContent = `export enum ${SchemaUtils.capitalize(tableName)}${this.fieldEnumSuffix} {\n`;

    columns.forEach((column: any, index: number) => {
      const fieldName = SchemaUtils.formatColumnName(column.COLUMN_NAME);
      enumContent += `  ${fieldName} = "${fieldName}"`;
      if (index < columns.length - 1) enumContent += ',';
      enumContent += '\n';
    });

    enumContent += `}\n\n`;
    return enumContent;
  }

  private static generateGetFieldTypeFunction(tableName: string, columns: any[], enumMapping: Record<string, string>): string {
    let enumContent = `export function get${SchemaUtils.capitalize(tableName)}FieldType(field: ${SchemaUtils.capitalize(tableName)}${this.fieldEnumSuffix}): ${this.baseEntityFieldType} {\n`;

    enumContent += `  switch (field) {\n`;

    columns.forEach((column: any) => {
      const fieldName = SchemaUtils.formatColumnName(column.COLUMN_NAME);
      enumContent += `    case ${SchemaUtils.capitalize(tableName)}${this.fieldEnumSuffix}.${fieldName}:\n`;
      enumContent += `      return ${this.baseEntityFieldType}.${SchemaUtils.mapMySQLTypeToBaseEntityFieldType(column.COLUMN_NAME, column.DATA_TYPE, enumMapping, tableName)};\n`;
    });

    enumContent += `  }\n`;
    enumContent += `}\n\n`;
    return enumContent;
  }

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

  private static generateTextDiff(oldText: string, newText: string): string {
    const splitIntoSections = (text: string): Map<string, string> => {
      const sections = new Map<string, string>();
      const firstExportIdx = text.search(/^export /m);

      if (firstExportIdx > 0)
        sections.set('\x00preamble', text.slice(0, firstExportIdx));

      const body = firstExportIdx >= 0 ? text.slice(firstExportIdx) : text;
      for (const part of body.split(/(?=^export )/m)) {
        if (!part.trim()) continue;
        sections.set(part.split('\n')[0], part);
      }
      return sections;
    };

    const oldSections = splitIntoSections(oldText);
    const newSections = splitIntoSections(newText);
    const diffLines: string[] = [];

    for (const [key, newSection] of newSections) {
      const oldSection = oldSections.get(key);
      const label = key === '\x00preamble' ? '(preamble)' : key;
      if (!oldSection) {
        diffLines.push(`+++ ${label}`);
        newSection.split('\n').forEach(l => diffLines.push(`+ ${l}`));
        diffLines.push('');
      } else if (oldSection !== newSection) {
        diffLines.push(`~~~ ${label}`);
        diffLines.push(...this.diffSection(oldSection.split('\n'), newSection.split('\n')));
        diffLines.push('');
      }
    }

    for (const [key] of oldSections) {
      if (!newSections.has(key)) {
        const label = key === '\x00preamble' ? '(preamble)' : key;
        diffLines.push(`--- ${label} (removed)`);
        diffLines.push('');
      }
    }

    return diffLines.length > 0 ? diffLines.join('\n') : '(no differences found)';
  }

  private static diffSection(oldLines: string[], newLines: string[]): string[] {
    const m = oldLines.length;
    const n = newLines.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = oldLines[i - 1] === newLines[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);

    type Op = { type: 'eq' | 'add' | 'del'; line: string };
    const ops: Op[] = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
        ops.push({ type: 'eq', line: oldLines[i - 1] }); i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        ops.push({ type: 'add', line: newLines[j - 1] }); j--;
      } else {
        ops.push({ type: 'del', line: oldLines[i - 1] }); i--;
      }
    }
    ops.reverse();

    const CONTEXT = 1;
    const result: string[] = [];
    let lastPrinted = -1;

    for (let k = 0; k < ops.length; k++) {
      if (ops[k].type !== 'eq') {
        const from = Math.max(0, k - CONTEXT);
        const to = Math.min(ops.length - 1, k + CONTEXT);
        if (from > lastPrinted + 1) result.push('  ...');
        for (let l = Math.max(from, lastPrinted + 1); l <= to; l++) {
          const prefix = ops[l].type === 'add' ? '+' : ops[l].type === 'del' ? '-' : ' ';
          result.push(`${prefix} ${ops[l].line}`);
          lastPrinted = l;
        }
      }
    }

    return result;
  }

  static async generateTableInterfacesAsync(
    outputFilePath: string,
    enumFileLocation: string,
    enumFile: string,
    validate: boolean = false
  ): Promise<void> {
    const databaseName = getDatabaseName();

    // Get all enums from the index.ts file
    const enumPaths = SchemaUtils.getExportedEnums(enumFileLocation, enumFile);
    const enumMapping = await SchemaUtils.createEnumMapping(enumFileLocation, enumPaths);

    // Get all tables in the database
    const tablesQuery = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = ?
    `;
    const tables = await runQueryAsync(tablesQuery, [databaseName]);

    // Collect all JSON interface imports needed
    const jsonInterfaceImports = await InterfaceImportManager.collectJsonInterfaceImports(
      tables as any[],
      SchemaUtils
    );

    // Validate that all required JSON interfaces exist
    if (jsonInterfaceImports.size > 0) {
      JsonInterfaceValidator.validateJsonInterfaces(jsonInterfaceImports);
    }

    // Generate header with imports
    let interfaceContent = InterfaceImportManager.generateHeader(jsonInterfaceImports);
    interfaceContent += `import { BaseEntityClass } from '../../utils/database/BaseEntityClass';\n`;
    interfaceContent += `import { BaseEntity, ${this.baseEntityFieldType} } from '../../interfaces/database/BaseEntity';\n\n`;

    for (const table of tables as any[]) {
      const tableName = table['TABLE_NAME'];

      // Get columns for table
      const columnsQuery = `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = ? 
            AND table_schema = ?
        `;
      const columns = await runQueryAsync(columnsQuery, [tableName, databaseName]);

      // Generate interface content
      interfaceContent += `export interface ${SchemaUtils.capitalize(tableName)}${this.suffix} {\n`;

      // Filter out old columns when JSON equivalent exists
      const filteredColumns = this.filterDuplicateColumns(columns as any[]);

      filteredColumns.forEach((column: any) => {
        interfaceContent += `  ${SchemaUtils.formatColumnName(column.COLUMN_NAME)}: ${SchemaUtils.mapMySQLTypeToTypescript(column.COLUMN_NAME, column.DATA_TYPE, enumMapping, tableName)};\n`;
      });

      interfaceContent += `}\n\n`;

      interfaceContent += this.generateFieldEnum(tableName, filteredColumns);

      interfaceContent += this.generateGetFieldTypeFunction(tableName, filteredColumns, enumMapping);

      const modelClassName = `${SchemaUtils.capitalize(tableName)}${this.suffix}`;
      const fieldEnumName = `${SchemaUtils.capitalize(tableName)}${this.fieldEnumSuffix}`;
      const tableEnumEnum = getEnumValue(TableEnum, tableName.toUpperCase());

      if (!tableEnumEnum)
        continue;

      interfaceContent += `export class ${modelClassName} extends BaseEntityClass<${fieldEnumName}> implements ${modelClassName} {\n`;
      interfaceContent += `  protected static fieldEnum = ${fieldEnumName};\n`;
      interfaceContent += `  protected static tableEnum = enums.TableEnum.${tableEnumEnum};\n\n`;

      filteredColumns.forEach((column: any) => {
        const fieldName = SchemaUtils.formatColumnName(column.COLUMN_NAME);
        if (fieldName !== 'Id') {
          interfaceContent += `  ${fieldName}: ${SchemaUtils.mapMySQLTypeToTypescript(column.COLUMN_NAME, column.DATA_TYPE, enumMapping, tableName)};\n`;
        }
      });

      interfaceContent += `\n  constructor(data: Partial<${modelClassName}>) {\n`;
      interfaceContent += `    super(data as BaseEntity);\n`;
      filteredColumns.forEach((column: any) => {
        const fieldName = SchemaUtils.formatColumnName(column.COLUMN_NAME);
        interfaceContent += `    this.${fieldName} = data.${fieldName}!;\n`;
      });
      interfaceContent += `  }\n`;
      interfaceContent += `}\n\n`;

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

      const saveModelClassName = `${SchemaUtils.capitalize(tableName)}${this.saveSuffix}`;
      const saveModelInterfaceName = `${SchemaUtils.capitalize(tableName)}${this.saveSuffix}`;
      interfaceContent += `export class ${saveModelClassName} extends BaseEntityClass<${fieldEnumName}> implements ${saveModelInterfaceName} {\n`;
      interfaceContent += `  protected static fieldEnum = ${fieldEnumName};\n`;
      interfaceContent += `  protected static tableEnum = enums.TableEnum.${tableEnumEnum};\n`;

      const fieldToPropertyEntries: string[] = [];
      filteredColumns.forEach((column: any) => {
        const logicalName = SchemaUtils.formatColumnName(column.COLUMN_NAME);
        const propertyName = SchemaUtils.isJsonField(column.COLUMN_NAME)
          ? column.COLUMN_NAME
          : logicalName;
        if (logicalName !== propertyName)
          fieldToPropertyEntries.push(`${logicalName}: "${propertyName}"`);
      });
      if (fieldToPropertyEntries.length > 0) {
        interfaceContent += `  protected static fieldToPropertyMap: Record<string, string> = { ${fieldToPropertyEntries.join(', ')} };\n`;
      }
      interfaceContent += `\n`;

      filteredColumns.forEach((column: any) => {
        const columnName = SchemaUtils.isJsonField(column.COLUMN_NAME)
          ? column.COLUMN_NAME
          : SchemaUtils.formatColumnName(column.COLUMN_NAME);
        if (columnName !== 'Id') {
          interfaceContent += `  ${columnName}?: ${SchemaUtils.mapMySQLTypeToTypescript(column.COLUMN_NAME, column.DATA_TYPE, enumMapping, tableName)};\n`;
        }
      });

      interfaceContent += `\n  constructor(data: Partial<${saveModelInterfaceName}>) {\n`;
      interfaceContent += `    super({ Id: data.Id ?? 0 });\n`;
      filteredColumns.forEach((column: any) => {
        const columnName = SchemaUtils.isJsonField(column.COLUMN_NAME)
          ? column.COLUMN_NAME
          : SchemaUtils.formatColumnName(column.COLUMN_NAME);
        if (columnName === 'Id') {
          interfaceContent += `    if (data.Id !== undefined) this.Id = data.Id;\n`;
        } else {
          interfaceContent += `    if (data.${columnName} !== undefined) this.${columnName} = data.${columnName};\n`;
        }
      });
      interfaceContent += `  }\n`;
      interfaceContent += `}\n\n`;
    }

    // Write interfaces to file
    if (validate) {
      const existingContent = fs.readFileSync(outputFilePath, 'utf-8');
      if (existingContent !== interfaceContent) {
        const diff = this.generateTextDiff(existingContent, interfaceContent);
        Logger.logError(`Interfaces have changed, please update the database.\n${diff}`, undefined, { sendToDiscord: true });
      }
      return;
    } else {
      fs.writeFileSync(outputFilePath, interfaceContent);
    }

    Logger.logInfo('Interfaces gegenereerd in ' + outputFilePath);
  }
} 