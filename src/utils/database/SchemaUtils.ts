import * as fs from 'fs';
import * as path from 'path';

export class SchemaUtils {
  static capitalize(str: string): string {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  static formatColumnName(columnName: string): string {
    let formattedName = SchemaUtils.removeMultiLingualStringSuffix(columnName);
    formattedName = SchemaUtils.removeJsonSuffix(formattedName);
    return formattedName;
  }

  static isMultiLingualString(columnName: string): boolean {
    return columnName.toLowerCase().endsWith('mls');
  }

  static removeMultiLingualStringSuffix(columnName: string): string {
    return columnName.replace('MLS', '').replace('mls', '');
  }

  static isJsonField(columnName: string): boolean {
    return columnName.toLowerCase().endsWith('json');
  }

  static removeJsonSuffix(columnName: string): string {
    return columnName.replace(/JSON$/i, '').replace(/json$/i, '');
  }

  static convertToEnumName(procedureName: string): string {
    return procedureName
      .replace(/[^a-zA-Z0-9_]/g, '_')  // Replace special chars with underscores
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  static convertToPascalCaseEnumName(procedureName: string): string {
    const words = procedureName
      .replace(/[^a-zA-Z0-9]/g, '_')
      .split('_')
      .flatMap(part => part.split(/(?=[A-Z])/).filter(Boolean));
    if (words.length === 0) return procedureName;
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  }

  static mapMySQLTypeToTypescript(columnName: string, mysqlType: string, enumMapping: Record<string, string>, tableName?: string): string {
    const lowercaseName = columnName.toLowerCase();

    if (enumMapping[lowercaseName])
      return enumMapping[lowercaseName];

    if (SchemaUtils.isMultiLingualString(columnName))
      return 'MultiLingualString';

    if (SchemaUtils.isJsonField(columnName) && tableName) {
      // Generate interface name: TableName_ColumnName
      const interfaceName = `${SchemaUtils.capitalize(tableName)}_${SchemaUtils.removeJsonSuffix(columnName)}`;
      return interfaceName;
    }

    switch (mysqlType.toLowerCase()) {
      case 'int':
      case 'smallint':
      case 'mediumint':
      case 'bigint':
      case 'float':
      case 'double':
      case 'decimal':
        return 'number';
      case 'varchar':
      case 'text':
      case 'char':
      case 'tinytext':
      case 'mediumtext':
      case 'longtext':
        return 'string';
      case 'date':
      case 'datetime':
      case 'timestamp':
        return 'Date';
      case 'boolean':
      case 'tinyint':
        return 'boolean';
      default:
        return 'any';
    }
  }

  static getExportedEnums(enumFileLocation: string, enumFile: string): string[] {
    const filePath = path.resolve(enumFileLocation, enumFile);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const regex = /export\s*\*\s*from\s*["'](.*?Enum)["']/g;
    const matches = [...fileContent.matchAll(regex)];
    const enumPaths = matches.map(match => `${match[1]}.ts`);
    return enumPaths;
  }

  static async importEnum(enumFileLocation: string, enumPath: string): Promise<Record<string, any>> {
    const resolvedPath = path.resolve(enumFileLocation, enumPath);
    const module = require(resolvedPath);
    return module;
  }

  static async createEnumMapping(enumFileLocation: string, enumPaths: string[]): Promise<Record<string, string>> {
    const enumMapping: Record<string, string> = {};
    for (const enumPath of enumPaths) {
      const enumObject = await SchemaUtils.importEnum(enumFileLocation, enumPath);
      for (const enumKey of Object.keys(enumObject)) {
        enumMapping[enumKey.toLowerCase()] = `enums.${enumKey}`;
      }
    }
    return enumMapping;
  }
} 