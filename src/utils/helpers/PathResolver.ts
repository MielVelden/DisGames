import * as path from 'path';
import * as fs from 'fs';

export class PathResolver {
    private static projectRoot: string | null = null;

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

    static resolveTests(...pathSegments: string[]): string {
        return this.resolve('tests', ...pathSegments);
    }

    static relative(from: string, to: string): string {
        return path.relative(from, to);
    }

    static reset(): void {
        this.projectRoot = null;
    }
}

export function resolveProjectPath(...pathSegments: string[]): string {
    return PathResolver.resolve(...pathSegments);
}

export function resolveSrcPath(...pathSegments: string[]): string {
    return PathResolver.resolveSrc(...pathSegments);
}

export function resolveDistPath(...pathSegments: string[]): string {
    return PathResolver.resolveDist(...pathSegments);
}

export function resolveTestsPath(...pathSegments: string[]): string {
    return PathResolver.resolveTests(...pathSegments);
}