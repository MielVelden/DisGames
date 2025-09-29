import Logger from './Logger';
import { InterfaceCollector } from './InterfaceCollector';
import { EndpointCollector } from './EndpointCollector';
import { MethodNameUtils } from './MethodNameUtils';
import { InterfaceInfo, EndpointInfo } from '../interfaces/application/Controller';

export class TypeScriptGenerator {
    static async generateApiTypes(): Promise<string> {
        try {
            const interfaces = await InterfaceCollector.collectAllInterfaces();
            const endpoints = await EndpointCollector.collectAllEndpoints();

            Logger.logInfo(`Found ${interfaces.length} interfaces and ${endpoints.length} endpoints`);

            return this.buildCompleteFrontendWrapper(interfaces, endpoints);
        } catch (error) {
            Logger.logError('Error generating API types:', error as Error);
            throw error;
        }
    }

    private static buildCompleteFrontendWrapper(interfaces: InterfaceInfo[], endpoints: EndpointInfo[]): string {
        let output = '// Auto-generated TypeScript definitions and API wrapper for DisGames\n';
        output += '// Generated on: ' + new Date().toISOString() + '\n\n';

        // Add imports and types
        output += 'async function getJson<T = unknown>(path: string): Promise<T> {\n';
        output += '  const res = await fetch(path);\n';
        output += '  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);\n';
        output += '  return res.json() as T;\n';
        output += '}\n\n';

        // Generate exported interfaces first (for global access)
        output += '// ===== GLOBAL EXPORTS =====\n';
        const interfacesByCategory = this.groupInterfacesByCategory(interfaces);
        const endpointsByController = this.groupEndpointsByController(endpoints);

        for (const [category, categoryInterfaces] of interfacesByCategory.entries()) {
            output += `// ${category} Interfaces\n`;
            for (const interfaceInfo of categoryInterfaces) {
                // Clean up the interface content to remove namespace conflicts
                const cleanContent = this.cleanInterfaceContent(interfaceInfo.content);
                // No export keyword - these are just local models
                output += `${cleanContent}\n\n`;
            }
        }

        // Generate namespace definitions for type checking and API wrapper
        output += '// ===== DISGAMES NAMESPACE WITH EXPORTS AND API =====\n';

        // Generate namespace definitions for type checking
        output += '// ===== NAMESPACE DEFINITIONS FOR TYPE CHECKING =====\n';
        output += 'export declare namespace DisGames {\n\n';

        // Interfaces namespace (for type checking - contains all interfaces with exports)
        output += '  namespace Interfaces {\n';
        for (const [category, categoryInterfaces] of interfacesByCategory.entries()) {
            output += `    namespace ${category} {\n`;
            for (const interfaceInfo of categoryInterfaces) {
                const cleanContent = this.cleanInterfaceContent(interfaceInfo.content);
                // Add export keyword to the content
                const exportedContent = cleanContent.replace(/^(interface|type|enum|class)\s/, 'export $1 ');
                output += `      ${exportedContent}\n\n`;
            }
            output += '    }\n\n';
        }
        output += '  }\n\n';

        output += '}\n\n';

        // API implementation outside declare namespace (to avoid ambient context error)
        output += '// ===== API IMPLEMENTATION =====\n';
        output += 'export const DisGamesApi = {\n';

        for (const [controllerName, controllerEndpoints] of endpointsByController.entries()) {
            const urlNs = MethodNameUtils.toUrlNamespace(controllerName);
            output += `    ${controllerName}: {\n`;

            for (const endpoint of controllerEndpoints) {
                const pathFn = MethodNameUtils.toPathFunction(endpoint.methodName);
                const params = endpoint.parameters;

                if (params.length === 0) {
                    output += `      ${pathFn}: () => getJson<${endpoint.returnType}>(\`/api/${urlNs}/${pathFn}\`),\n`;
                } else if (params.length === 1) {
                    const p = params[0];
                    output += `      ${pathFn}: (${p.name}: ${p.type}) => getJson<${endpoint.returnType}>(\`/api/${urlNs}/${pathFn}/\${encodeURIComponent(String(${p.name}))}\`),\n`;
                } else {
                    // Multiple params -> use query string
                    const qs = params.map(p => `${p.name}=\${encodeURIComponent(String(${p.name}))}`).join("&");
                    const sig = params.map(p => `${p.name}: ${p.type}`).join(", ");
                    output += `      ${pathFn}: (${sig}) => getJson<${endpoint.returnType}>(\`/api/${urlNs}/${pathFn}?${qs}\`),\n`;
                }
            }

            output += '    },\n';
        }

        output += '} as const;\n';
        return output;
    }

    private static cleanInterfaceContent(content: string): string {
        // Remove export keywords and clean up the content
        let cleaned = content
            .replace(/^export\s+/gm, '')
            .replace(/import\s+.*?from\s+['"][^'"]*['"];?\s*/g, '')
            .replace(/\/\/.*$/gm, '')
            .trim();

        // Clean up enums.LanguageEnum -> LanguageEnum
        cleaned = cleaned.replace(/\benums\.(\w+Enum)\b/g, '$1');

        // Special handling for Discord interfaces - remove extends/implements
        if (cleaned.includes('Discord')) {
            cleaned = cleaned.replace(/\bextends\s+[^{]+/g, '');
            cleaned = cleaned.replace(/\bimplements\s+[^{]+/g, '');
        }

        // Remove method implementations from interfaces/classes
        cleaned = this.removeMethodImplementations(cleaned);

        return cleaned;
    }

    private static removeMethodImplementations(content: string): string {
        // Remove method implementations but keep method signatures
        // This handles both interfaces and classes
        let cleaned = content;

        // Remove private fields from classes
        cleaned = cleaned.replace(/private\s+readonly\s+\w+:\s*[^;]+;/g, '');
        cleaned = cleaned.replace(/private\s+\w+:\s*[^;]+;/g, '');
        cleaned = cleaned.replace(/protected\s+\w+:\s*[^;]+;/g, '');

        // Replace Discord types with any
        cleaned = cleaned.replace(/(?<!\b(?:interface|class)\s)Discord\w+/g, 'any');

        // Remove MultiLingualString implementations
        cleaned = cleaned.replace(/MultiLingualString/g, 'any');

        // Remove constructor implementations completely
        cleaned = cleaned.replace(/constructor\([^)]*\)\s*\{[^}]*\}/g, '');

        // More aggressive approach: remove all method bodies that contain implementation
        // This regex matches method signatures followed by bodies with any content
        cleaned = cleaned.replace(/(\w+)\s*\([^)]*\)\s*:\s*[^{]*\s*\{[^}]*\}/g, (match) => {
            const signatureMatch = match.match(/^([^{]+)/);
            if (signatureMatch) {
                return signatureMatch[1].trim() + ';';
            }
            return match;
        });

        // Remove getter/setter implementations
        cleaned = cleaned.replace(/get\s+(\w+)\s*\([^)]*\)\s*:\s*[^{]*\s*\{[^}]*\}/g, (match) => {
            const signatureMatch = match.match(/^([^{]+)/);
            if (signatureMatch) {
                return signatureMatch[1].trim() + ';';
            }
            return match;
        });

        cleaned = cleaned.replace(/set\s+(\w+)\s*\([^)]*\)\s*:\s*[^{]*\s*\{[^}]*\}/g, (match) => {
            const signatureMatch = match.match(/^([^{]+)/);
            if (signatureMatch) {
                return signatureMatch[1].trim() + ';';
            }
            return match;
        });

        // Remove static method implementations
        cleaned = cleaned.replace(/static\s+(\w+)\s*\([^)]*\)\s*:\s*[^{]*\s*\{[^}]*\}/g, (match) => {
            const signatureMatch = match.match(/^([^{]+)/);
            if (signatureMatch) {
                return signatureMatch[1].trim() + ';';
            }
            return match;
        });

        // Remove public/private method implementations
        cleaned = cleaned.replace(/(public|private)\s+(\w+)\s*\([^)]*\)\s*:\s*[^{]*\s*\{[^}]*\}/g, (match) => {
            const signatureMatch = match.match(/^([^{]+)/);
            if (signatureMatch) {
                return signatureMatch[1].trim() + ';';
            }
            return match;
        });

        // More aggressive cleaning for MultiLingualString and similar classes
        cleaned = this.replaceClassBodyBalanced(cleaned, "MultiLingualString", "{}");
        cleaned = this.replaceClassBodyBalanced(cleaned, "GameEvent", "{}");

        return cleaned;
    }

    private static replaceClassBodyBalanced(src: string, className: string, newBody = "{}"): string {
        const re = new RegExp(`\\bclass\\s+${className}\\s*\\{`, "g");
        let out = "";
        let last = 0;
        let m;

        while ((m = re.exec(src)) !== null) {
            const open = re.lastIndex - 1;
            let i = open;
            let depth = 0;
            let inStr: '"' | "'" | "`" | null = null;
            let inLineComment = false;
            let inBlockComment = false;

            for (; i < src.length; i++) {
                const ch = src[i];
                const nx = src[i + 1];

                // comments
                if (inLineComment) {
                    if (ch === "\n")
                        inLineComment = false;

                    continue;
                }

                if (inBlockComment) {
                    if (ch === "*" && nx === "/")
                        inBlockComment = false; i++;

                    continue;
                }

                if (!inStr) {
                    if (ch === "/" && nx === "/") {
                        inLineComment = true;
                        i++;
                        continue;
                    }

                    if (ch === "/" && nx === "*") {
                        inBlockComment = true;
                        i++;
                        continue;
                    }
                }

                // strings (incl. escapes)
                if (inStr) {
                    if (ch === "\\") {
                        i++;
                        continue;
                    }

                    if (ch === inStr)
                        inStr = null;

                    else if (inStr === "`" && ch === "$" && nx === "{") {
                        depth++;
                        i++;
                    }
                    
                    continue;
                } else if (ch === `"` || ch === `'` || ch === "`") {
                    inStr = ch as any;
                    continue;
                }

                // brace balans
                if (ch === "{") { 
                    depth++; 
                    continue; 
                }

                if (ch === "}") {
                    depth--;
                    if (depth === 0) {
                        out += src.slice(last, m.index) + src.slice(m.index, open).replace(/\s*$/, "") + " " + newBody;
                        last = i + 1;
                        break;
                    }
                }
            }

            if (i >= src.length) 
                break; // safety

            re.lastIndex = last;
        }
        return out + src.slice(last);
    }


    private static buildTypeScriptDefinition(interfaces: InterfaceInfo[], endpoints: EndpointInfo[]): string {
        let output = '// Auto-generated TypeScript definitions for DisGames API\n';
        output += '// Generated on: ' + new Date().toISOString() + '\n\n';

        const interfacesByCategory = this.groupInterfacesByCategory(interfaces);

        output += 'declare namespace DisGames {\n\n';

        // Generate Interfaces namespace
        output += '  namespace Interfaces {\n';
        for (const [category, categoryInterfaces] of interfacesByCategory.entries()) {
            output += `    namespace ${category} {\n`;
            for (const interfaceInfo of categoryInterfaces) {
                output += `      ${interfaceInfo.content}\n\n`;
            }
            output += '    }\n\n';
        }
        output += '  }\n\n';

        // Generate API namespace
        output += '  namespace Api {\n';

        // Group endpoints by controller
        const endpointsByController = this.groupEndpointsByController(endpoints);

        for (const [controllerName, controllerEndpoints] of endpointsByController.entries()) {
            output += `    namespace ${controllerName} {\n`;

            for (const endpoint of controllerEndpoints) {
                const params = endpoint.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
                output += `      function ${endpoint.methodName}(${params}): Promise<${endpoint.returnType}>;\n`;
            }

            output += '    }\n\n';
        }

        output += '  }\n';
        output += '}\n';

        return output;
    }

    private static groupInterfacesByCategory(interfaces: InterfaceInfo[]): Map<string, InterfaceInfo[]> {
        const grouped = new Map<string, InterfaceInfo[]>();
        const seenInterfaces = new Set<string>();

        for (const interfaceInfo of interfaces) {
            // Skip duplicates based on name only
            if (seenInterfaces.has(interfaceInfo.name)) {
                continue;
            }
            seenInterfaces.add(interfaceInfo.name);

            if (!grouped.has(interfaceInfo.category)) {
                grouped.set(interfaceInfo.category, []);
            }
            grouped.get(interfaceInfo.category)!.push(interfaceInfo);
        }

        return grouped;
    }

    private static groupEndpointsByController(endpoints: EndpointInfo[]): Map<string, EndpointInfo[]> {
        const grouped = new Map<string, EndpointInfo[]>();

        for (const endpoint of endpoints) {
            if (!grouped.has(endpoint.controllerName)) {
                grouped.set(endpoint.controllerName, []);
            }
            grouped.get(endpoint.controllerName)!.push(endpoint);
        }

        return grouped;
    }
}
