import * as fs from 'fs';
import * as path from 'path';
import Logger from '../application/Logger';
import { ErrorHelper } from '../application/Error';
import { ExceptionEnum } from '../../interfaces/enums';

export class JsonInterfaceValidator {
  private static readonly DOMAIN_PATH = './src/interfaces/domain';

  static validateJsonInterfaces(jsonInterfaceImports: Set<string>): void {
    const missingInterfaces: string[] = [];

    for (const interfaceName of jsonInterfaceImports) {
      if (!this.doesInterfaceExist(interfaceName)) {
        missingInterfaces.push(interfaceName);
      }
    }

    if (missingInterfaces.length > 0) {
      const errorMessage = this.createErrorMessage(missingInterfaces);
      Logger.logError(errorMessage);
      ErrorHelper.throw(ExceptionEnum.JSON_INTERFACE_VALIDATION_FAILED);
    }
  }

  private static doesInterfaceExist(interfaceName: string): boolean {
    // Check if there's a direct file match
    const directFilePath = path.join(this.DOMAIN_PATH, `${interfaceName}.ts`);
    if (fs.existsSync(directFilePath)) {
      return true;
    }

    // Search in existing domain files
    try {
      const domainFiles = fs.readdirSync(this.DOMAIN_PATH).filter(file => file.endsWith('.ts'));

      for (const file of domainFiles) {
        const filePath = path.join(this.DOMAIN_PATH, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        // Look for the interface definition (not commented out)
        const interfaceRegex = new RegExp(`^\\s*export\\s+interface\\s+${interfaceName}\\s*{`, 'm');
        if (interfaceRegex.test(fileContent)) {
          return true;
        }
      }
    } catch (error) {
      Logger.logError(`Error reading domain directory: ${error}`);
    }

    return false;
  }

  private static createErrorMessage(missingInterfaces: string[]): string {
    return `
        ❌ Missing JSON Interface Definitions!
        
        The following interfaces are required for JSON fields but could not be found:
        ${missingInterfaces.map(name => `  - ${name}`).join('\n')}
        
        Please create these interface definitions in the src/interfaces/domain/ folder.
        
        Example for ${missingInterfaces[0]}:
        
        // src/interfaces/domain/${missingInterfaces[0]}.ts
        export interface ${missingInterfaces[0]} {
          // Define your JSON structure here
        }
        
        Then add it to src/interfaces/domain/index.ts:
        export * from './${missingInterfaces[0]}';
      `;
  }
} 