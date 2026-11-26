import * as fs from "fs";
import * as path from "path";
import Logger from "../application/Logger";

export interface ModuleCollectorOptions<T> {
    directoryPath: string;
    label: string;
    isValid: (module: Partial<T> | undefined) => module is T;
    onInvalid?: (file: string) => void;
}

export interface AsyncModuleCollectorOptions<T> extends ModuleCollectorOptions<T> {
    onLoadAsync: (module: T, file: string) => Promise<void>;
}

function listModuleFiles(directoryPath: string): string[] {
    return fs.readdirSync(directoryPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
}

function requireDefault<T>(directoryPath: string, file: string): Partial<T> | undefined {
    return require(path.join(directoryPath, file)).default;
}

export function collectModules<T>(options: ModuleCollectorOptions<T>): T[] {
    const modules: T[] = [];

    try {
        for (const file of listModuleFiles(options.directoryPath)) {
            try {
                const module = requireDefault<T>(options.directoryPath, file);
                if (options.isValid(module))
                    modules.push(module);
                else
                    options.onInvalid?.(file);
            } catch (error) {
                Logger.logError(`Error loading ${options.label} file ${file}:`, error as Error);
            }
        }
    } catch (error) {
        Logger.logError(`Error loading ${options.label} directory:`, error as Error);
    }

    return modules;
}

export async function collectModulesAsync<T>(options: AsyncModuleCollectorOptions<T>): Promise<void> {
    try {
        for (const file of listModuleFiles(options.directoryPath)) {
            try {
                const module = requireDefault<T>(options.directoryPath, file);
                if (options.isValid(module))
                    await options.onLoadAsync(module, file);
                else
                    options.onInvalid?.(file);
            } catch (error) {
                Logger.logError(`Error loading ${options.label} file ${file}:`, error as Error);
            }
        }
    } catch (error) {
        Logger.logError(`Error loading ${options.label} directory:`, error as Error);
    }
}
