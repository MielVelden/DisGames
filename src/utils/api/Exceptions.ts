import { InterfaceInfo } from '../../interfaces/application/Controller';

export interface TypeException {
    typeName: string;
    pattern?: RegExp;
    customDefinition?: string | ((matchedType: string) => string);
    skipExport?: boolean;
}

export const TYPE_EXCEPTIONS: TypeException[] = [
    {
        typeName: 'MultiLingualString',
        customDefinition: 'export type MultiLingualString = Record<DisGames.Interfaces.Enums.LanguageEnum, string>;'
    },
    {
        typeName: 'Client',
        customDefinition: 'export type Client = any;'
    },
    {
        typeName: 'ClientOptions',
        skipExport: true
    },
    {
        typeName: 'DiscordInteractionPattern',
        pattern: /^Discord.*Interaction$/,
        customDefinition: matched => `export type ${matched} = any;`
    },
    {
        typeName: 'DiscordMessage',
        customDefinition: 'export type DiscordMessage = any;'
    },
    {
        typeName: 'DiscordGuild',
        customDefinition: 'export type DiscordGuild = any;'
    },
    {
        typeName: 'BaseRepository',
        customDefinition: 'export type BaseRepository<T extends DisGames.Interfaces.Database.BaseEntity, S extends DisGames.Interfaces.Database.BaseEntity> = any;'
    },
    {
        typeName: 'ConfigValueTypeMap',
        customDefinition: 'export type ConfigValueTypeMap = any;'
    }
];

function clonePattern(pattern?: RegExp): RegExp | undefined {
    return pattern ? new RegExp(pattern.source, pattern.flags) : undefined;
}

function matchesException(exception: TypeException, typeName: string): boolean {
    if (exception.typeName === typeName)
        return true;

    const regex = clonePattern(exception.pattern);
    return regex?.test(typeName) ?? false;
}

function resolveCustomDefinition(exception: TypeException, typeName: string): string | null {
    if (!exception.customDefinition)
        return null;

    return typeof exception.customDefinition === 'function'
        ? exception.customDefinition(typeName)
        : exception.customDefinition;
}

function findException(typeName: string): TypeException | undefined {
    return TYPE_EXCEPTIONS.find(ex => matchesException(ex, typeName));
}

export function isException(typeName: string): boolean {
    return Boolean(findException(typeName));
}

export function getExceptionDefinition(typeName: string): string | null {
    const exception = findException(typeName);
    return exception ? resolveCustomDefinition(exception, typeName) : null;
}

export function collectExceptionDefinitions(interfaces: InterfaceInfo[]): string[] {
    const definitions: string[] = [];
    const seenDefinitions = new Set<string>();
    const candidateNames = collectCandidateNames(interfaces);

    const addDefinition = (definition: string | null) => {
        if (definition && !seenDefinitions.has(definition)) {
            seenDefinitions.add(definition);
            definitions.push(definition);
        }
    }

    for (const exception of TYPE_EXCEPTIONS) {
        if (exception.skipExport || !exception.customDefinition)
            continue;

        if (exception.pattern) {
            for (const name of candidateNames) {
                if (!matchesException(exception, name))
                    continue;

                addDefinition(resolveCustomDefinition(exception, name));
            }
        } else
            addDefinition(resolveCustomDefinition(exception, exception.typeName));
    }

    return definitions;
}

function collectCandidateNames(interfaces: InterfaceInfo[]): string[] {
    const nameSet = new Set<string>();
    const identifierRegex = /\b[A-Za-z_][A-Za-z0-9_]*\b/g;

    for (const interfaceInfo of interfaces) {
        nameSet.add(interfaceInfo.name);

        const matches = interfaceInfo.content.match(identifierRegex);
        if (!matches)
            continue;

        for (const match of matches) {
            nameSet.add(match);
        }
    }

    return Array.from(nameSet);
}

export function cleanupQualifiedTypes(content: string): string {
    let result = content;
    
    result = result.replace(/\benums\.DisGames\.Interfaces\./g, 'DisGames.Interfaces.');
    result = result.replace(/\b(application|database|domain|enums|view)\.DisGames\.Interfaces\./gi, 'DisGames.Interfaces.');
    
    return result;
}

