export interface Repository<T> {
    getByIDAsync(id: string): Promise<T>;
    getAllAsync(): Promise<T[]>;
    saveAsync(data: T): Promise<T>;
    purgeAsync(id: string): Promise<void>;
}
