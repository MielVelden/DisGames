export interface TypeException {
    typeName: string;
    customDefinition?: string;
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
        typeName: 'DiscordInteraction',
        customDefinition: 'export type DiscordInteraction = any;'
    },
    {
        typeName: 'DiscordMessage',
        customDefinition: 'export type DiscordMessage = any;'
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

export function isException(typeName: string): boolean {
    return TYPE_EXCEPTIONS.some(ex => ex.typeName === typeName);
}

export function getExceptionDefinition(typeName: string): string | null {
    const exception = TYPE_EXCEPTIONS.find(ex => ex.typeName === typeName);
    return exception?.customDefinition ?? null;
}

export function cleanupQualifiedTypes(content: string): string {
    let result = content;
    
    result = result.replace(/\benums\.DisGames\.Interfaces\./g, 'DisGames.Interfaces.');
    result = result.replace(/\b(application|database|domain|enums|view)\.DisGames\.Interfaces\./gi, 'DisGames.Interfaces.');
    
    return result;
}

