import BaseRepository from "../../repositories/BaseRepository";
import { BaseEntity } from "./BaseEntity";

export interface Repository<T> {
    getByIdAsync(id: number): Promise<T | null>;
    getAllAsync(): Promise<T[]>;
    saveAsync(savable: T): Promise<T>;
    purgeAsync(id: number): Promise<void>;
}

export interface RepositoryWithBase<T extends BaseEntity, S extends BaseEntity, F extends Record<string, string> = Record<string, string>> extends Repository<T> {
    readonly baseRepository: BaseRepository<T, S, F>;
}