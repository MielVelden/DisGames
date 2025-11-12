import * as path from 'path';
import * as fs from 'fs';

export class PathResolver {
    private static projectRoot: string | null = null;
    private static isDevelopmentMode: boolean | null = null;

    static getProjectRoot(): string {
        if (this.projectRoot) {
            return this.projectRoot;
        }

        let currentDir = __dirname;
        let maxDepth = 10;
        
        while (maxDepth > 0) {
            const packageJsonPath = path.join(currentDir, 'package.json');
            
            if (fs.existsSync(packageJsonPath)) {
                this.projectRoot = currentDir;
                return currentDir;
            }
            
            const parentDir = path.dirname(currentDir);
            if (parentDir === currentDir) {
                break;
            }
            
            currentDir = parentDir;
            maxDepth--;
        }
        
        throw new Error('Could not find project root (package.json not found)');
    }

    static isDev(): boolean {
        if (this.isDevelopmentMode !== null)
            return this.isDevelopmentMode;

        const dirnameParts = __dirname.split(path.sep);
        this.isDevelopmentMode = dirnameParts.includes('src');
        return this.isDevelopmentMode;
    }

    static resolve(...pathSegments: string[]): string {
        const root = this.getProjectRoot();
        return path.join(root, ...pathSegments);
    }

    static resolveSrc(...pathSegments: string[]): string {
        return this.resolve('src', ...pathSegments);
    }

    static resolveDist(...pathSegments: string[]): string {
        return this.resolve('dist', ...pathSegments);
    }

    static resolvePath(...pathSegments: string[]): string {
        return this.isDev() 
            ? this.resolveSrc(...pathSegments)
            : this.resolveDist(...pathSegments);
    }

    static relative(from: string, to: string): string {
        return path.relative(from, to);
    }

    static reset(): void {
        this.projectRoot = null;
    }
}

export function resolvePath(...pathSegments: string[]): string {
    return PathResolver.resolvePath(...pathSegments);
}