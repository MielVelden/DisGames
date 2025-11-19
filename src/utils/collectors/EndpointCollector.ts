import * as fs from 'fs';
import * as path from 'path';
import { MethodNameUtils } from '../helpers/MethodNames';
import { EndpointInfo, ParameterInfo } from '../../interfaces/application/Controller';
import { resolveSourcePath } from '../helpers/PathResolver';

export class EndpointCollector {
    private static readonly CONTROLLERS_PATH = resolveSourcePath('controllers');

    static async collectAllEndpointsAsync(): Promise<EndpointInfo[]> {
        const endpoints: EndpointInfo[] = [];
        const controllerFiles = fs.readdirSync(this.CONTROLLERS_PATH)
            .filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && file !== 'ApiController.ts');

        for (const file of controllerFiles) {
            const filePath = path.join(this.CONTROLLERS_PATH, file);
            const controllerName = file.replace('.ts', '').replace('.js', '').replace('Controller', '');
            
            const fileEndpoints = await this.extractEndpointsFromController(filePath, controllerName);
            endpoints.push(...fileEndpoints);
        }

        return endpoints;
    }

    private static async extractEndpointsFromController(filePath: string, controllerName: string): Promise<EndpointInfo[]> {
        const endpoints: EndpointInfo[] = [];
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Find all async methods
        const methodRegex = /async\s+(\w+)\s*\(([^)]*)\)\s*:\s*Promise<([^>]+)>/g;
        let match;

        while ((match = methodRegex.exec(content)) !== null) {
            const methodName = match[1];
            const parameters = match[2];
            const returnType = match[3];

            // Parse parameters
            const paramInfos = this.parseParameters(parameters);

            endpoints.push({
                controllerName: MethodNameUtils.capitalize(controllerName),
                methodName: MethodNameUtils.capitalize(MethodNameUtils.removeAsyncSuffix(methodName)),
                parameters: paramInfos.filter(p => !p.isIdentity), // Exclude identity parameters
                returnType: returnType.trim()
            });
        }

        return endpoints;
    }

    private static parseParameters(parameterString: string): ParameterInfo[] {
        if (!parameterString.trim()) 
            return [];

        return parameterString.split(',')
            .map(param => param.trim())
            .filter(param => param)
            .map(param => {
                const isIdentity = param.includes('identity') && param.includes('User');
                const [name, type] = param.split(':').map(p => p.trim());
                
                return {
                    name: name || '',
                    type: type || 'any',
                    isIdentity
                };
            });
    }
}
