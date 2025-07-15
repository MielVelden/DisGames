export interface Repository<T> {
    getByIDAsync(id: number): Promise<T | null>;
    getAllAsync(): Promise<T[]>;
    saveAsync(savable: T): Promise<T>;
    purgeAsync(id: number): Promise<void>;
}