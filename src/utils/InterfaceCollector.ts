import * as fs from 'fs';
import * as path from 'path';
import { InterfaceInfo } from '../interfaces/application/Controller';
import { MethodNameUtils } from './MethodNameUtils';

export class InterfaceCollector {
    private static readonly INTERFACES_PATH = path.join(__dirname, '../../src/interfaces');

    static async collectAllInterfaces(): Promise<InterfaceInfo[]> {
        const interfaces: InterfaceInfo[] = [];
        const categories = ['application', 'database', 'domain', 'enums', 'view'];

        for (const category of categories) {
            const categoryPath = path.join(this.INTERFACES_PATH, category);
            
            if (fs.existsSync(categoryPath)) {
                const categoryInterfaces = await this.scanDirectoryForInterfaces(categoryPath, category);
                interfaces.push(...categoryInterfaces);
            }
        }

        return interfaces;
    }

    private static async scanDirectoryForInterfaces(dirPath: string, category: string): Promise<InterfaceInfo[]> {
        const interfaces: InterfaceInfo[] = [];
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                // Recursively scan subdirectories
                const subInterfaces = await this.scanDirectoryForInterfaces(itemPath, category);
                interfaces.push(...subInterfaces);
            } else if (item.endsWith('.ts') && item !== 'index.ts') {
                // Scan TypeScript files for exports
                const fileInterfaces = await this.extractInterfacesFromFile(itemPath, category);
                interfaces.push(...fileInterfaces);
            }
        }

        return interfaces;
    }

    private static async extractInterfacesFromFile(filePath: string, category: string): Promise<InterfaceInfo[]> {
        const interfaces: InterfaceInfo[] = [];
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Extract interface names and their content
        const interfaceRegex = /export\s+(interface|type|enum|class)\s+(\w+)/g;
        let match;

        while ((match = interfaceRegex.exec(content)) !== null) {
            const type = match[1];
            const name = match[2];
            
            // Extract the full interface/enum/type definition
            const startIndex = match.index;
            const endIndex = this.findEndOfDefinition(content, startIndex);
            const definition = content.substring(startIndex, endIndex);

            interfaces.push({
                name: MethodNameUtils.capitalize(name),
                category: MethodNameUtils.capitalize(category),
                content: definition.trim()
            });
        }

        // Also extract export * statements for re-exports
        const exportStarRegex = /export\s+\*\s+from\s+['"]([^'"]+)['"]/g;
        while ((match = exportStarRegex.exec(content)) !== null) {
            const exportPath = match[1];
            interfaces.push({
                name: 'ReExport',
                category: MethodNameUtils.capitalize(category),
                content: `// Re-export from ${exportPath}`
            });
        }

        return interfaces;
    }

    private static findEndOfDefinition(content: string, startIndex: number): number {
        let braceCount = 0;
        let inString = false;
        let stringChar = '';
        
        for (let i = startIndex; i < content.length; i++) {
            const char = content[i];
            
            if (!inString && (char === '"' || char === "'" || char === '`')) {
                inString = true;
                stringChar = char;
            } else if (inString && char === stringChar) {
                inString = false;
            } else if (!inString) {
                if (char === '{') {
                    braceCount++;
                } else if (char === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        return i + 1;
                    }
                }
            }
        }
        
        return content.length;
    }
}
