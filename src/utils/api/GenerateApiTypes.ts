import { InterfaceCollector } from '../collectors/InterfaceCollector';
import { EndpointCollector } from '../collectors/EndpointCollector';
import { cleanupQualifiedTypes, isException, TYPE_EXCEPTIONS, getExceptionDefinition } from './Exceptions';

export async function generateDisGamesTypes(): Promise<string> {
    const interfaces = await InterfaceCollector.collectAllInterfaces();
    const endpoints = await EndpointCollector.collectAllEndpoints();

    const grouped = groupByCategory(interfaces);

    let output = '';
    output += `// Auto-generated TypeScript definitions and API wrapper for DisGames\n`;
    output += `// Generated on: ${new Date().toISOString()}\n\n`;

    for (const exception of TYPE_EXCEPTIONS) {
        if (exception.customDefinition && !exception.skipExport)
            output += `${exception.customDefinition}\n\n`;
    }

    output += `// ===== DISGAMES INTERFACES =====\n`;

    const categories = ['Application', 'Database', 'Domain', 'Enums', 'View'];
    for (const category of categories) {
        if (grouped[category] && grouped[category].length > 0) {
            output += `export namespace DisGames.Interfaces.${category} {\n`;

            const seenNames = new Set<string>();
            for (const interfaceInfo of grouped[category]) {
                if (isException(interfaceInfo.name))
                    continue;

                if (seenNames.has(interfaceInfo.name))
                    continue;

                seenNames.add(interfaceInfo.name);

                let qualifiedContent = interfaceInfo.content;
                qualifiedContent = removeImports(qualifiedContent);
                qualifiedContent = qualifyTypeReferences(qualifiedContent, category, interfaces);
                qualifiedContent = cleanupQualifiedTypes(qualifiedContent);
                output += `  ${qualifiedContent}\n\n`;
            }

            output += `}\n\n`;
        }
    }

    output += `// ===== DISGAMES API WRAPPER =====\n`;
    output += generateApiWrapper(endpoints, interfaces);

    return output;
}

function groupByCategory(interfaces: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    for (const interfaceInfo of interfaces) {
        const category = interfaceInfo.category;
        if (!grouped[category])
            grouped[category] = [];
        
        grouped[category].push(interfaceInfo);
    }

    return grouped;
}

function removeImports(content: string): string {
    return content.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '').trim();
}

function qualifyTypeReferences(content: string, currentCategory: string, allInterfaces: any[]): string {
    let result = content;

    const interfaceMap = new Map<string, string>();
    for (const interfaceInfo of allInterfaces) {
        interfaceMap.set(interfaceInfo.name, interfaceInfo.category);
    }

    for (const interfaceInfo of allInterfaces) {
        const name = interfaceInfo.name;
        const category = interfaceInfo.category;

        const regex = new RegExp(`\\b${name}\\b`, 'g');

        result = result.replace(regex, (match, offset) => {
            const before = result.substring(Math.max(0, offset - 50), offset);
            const after = result.substring(offset + match.length, Math.min(result.length, offset + match.length + 10));

            if (before.includes('import ') || before.includes('from '))
                return match;

            if (match.includes('DisGames.'))
                return match;

            const exportMatch = /export\s+(interface|type|enum|class)\s+$/.test(before);
            if (exportMatch)
                return match;
            

            if (before.includes('DisGames.Interfaces.'))
                return match;
            

            const isPropertyName = /^\s*(\?)?:/.test(after);
            if (isPropertyName)
                return match;

            const isEnumKey = /^\s*=\s*["']/.test(after);
            if (isEnumKey)
                return match;

            const afterChar = result.charAt(offset + match.length);
            if (afterChar && /[a-zA-Z0-9_]/.test(afterChar))
                return match;

            return `DisGames.Interfaces.${category}.${name}`;
        });
    }

    return result;
}

function generateApiWrapper(endpoints: any[], allInterfaces: any[]): string {
    let output = '';

    output += `// ===== DISGAMES API WRAPPER =====\n`;
    output += `import { apiClient } from "./api-client";\n\n`;

    output += `async function getJson<T = unknown>(path: string): Promise<T> {\n`;
    output += `  const response = await apiClient.get(path);\n`;
    output += `  return response.data as T;\n`;
    output += `}\n\n`;

    const groupedEndpoints = groupEndpointsByController(endpoints);

    output += `export const DisGamesApi = {\n`;

    const controllers = Object.keys(groupedEndpoints);
    for (let i = 0; i < controllers.length; i++) {
        const controller = controllers[i];
        const methods = groupedEndpoints[controller];

        output += `  ${controller}: {\n`;

        for (let j = 0; j < methods.length; j++) {
            const method = methods[j];
            const methodName = method.methodName.charAt(0).toLowerCase() + method.methodName.slice(1);
            const params = method.parameters;

            const qualifiedParams = params.map((p: any) => {
                const qualifiedType = qualifyTypeInString(p.type, allInterfaces);
                return `${p.name}: ${qualifiedType}`;
            }).join(', ');

            const paramsInUrl = params.map((p: any) =>
                `\${encodeURIComponent(String(${p.name}))}`
            ).join('/');

            const qualifiedReturnType = qualifyTypeInString(method.returnType, allInterfaces);

            let urlPath = `/${controller.toLowerCase()}/${methodName}`;
            if (params.length > 0) {
                urlPath += `/${paramsInUrl}`;
            }

            output += `    ${methodName}: (${qualifiedParams}) => getJson<${qualifiedReturnType}>(\`${urlPath}\`)`;

            if (j < methods.length - 1)
                output += ',';

            output += '\n';
        }

        output += `  }`;

        if (i < controllers.length - 1)
            output += ',';
        
        output += '\n';
    }

    output += `} as const;\n`;

    return output;
}

function qualifyTypeInString(typeString: string, allInterfaces: any[]): string {
    let result = typeString;

    for (const interfaceInfo of allInterfaces) {
        const name = interfaceInfo.name;
        const category = interfaceInfo.category;

        const regex = new RegExp(`\\b${name}\\b(?!\\.)`, 'g');
        result = result.replace(regex, (match) => {
            if (result.includes(`DisGames.Interfaces.${category}.${name}`))
                return match;
            
            return `DisGames.Interfaces.${category}.${name}`;
        });
    }

    result = cleanupQualifiedTypes(result);

    return result;
}

function groupEndpointsByController(endpoints: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    for (const endpoint of endpoints) {
        const controller = endpoint.controllerName;
        if (!grouped[controller])
            grouped[controller] = [];
        
        grouped[controller].push(endpoint);
    }

    return grouped;
}

