export interface Repository<T> {
    getByIdAsync(id: number): Promise<T | null>;
    getAllAsync(): Promise<T[]>;
    saveAsync(savable: T): Promise<T>;
    purgeAsync(id: number): Promise<void>;
}