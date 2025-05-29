export interface Repository<T> {
    getByIDAsync(id: number): Promise<T>;
    getByExternalIDAsync(externalId: string): Promise<T>;
    getAllAsync(): Promise<T[]>;
    saveAsync(savable: T): Promise<T>;
    purgeAsync(id: number): Promise<void>;
    purgeByExternalIDAsync(externalId: string): Promise<void>;
}