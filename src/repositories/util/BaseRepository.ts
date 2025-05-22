import { PrismaClient } from '@prisma/client';
import { Repository } from '../../interfaces/database/Repository';
import { getPrismaInstance } from './prisma';
import { IEntity } from '../../interfaces/database/IEntity';

// Type definitie om dynamisch toegang te krijgen tot Prisma modellen
type PrismaModelClient = PrismaClient & {
    [key: string]: any;
};

export class BaseRepository<T extends IEntity, E extends IEntity> implements Repository<T> {
    protected prisma: PrismaModelClient;
    protected modelName: string;
    protected externalIdField: string;
    
    constructor(modelName: string, externalIdField: string) {
        this.prisma = getPrismaInstance() as PrismaModelClient;
        this.modelName = modelName;
        this.externalIdField = externalIdField;
    }

    async getByIDAsync(id: number): Promise<T> {
        const result = await this.prisma[this.modelName].findUnique({
            where: { id }
        });
        
        if (!result) {
            throw new Error(`${this.modelName} with id ${id} not found`);
        }
        
        return this.mapEntityToModel(result);
    }

    async getByExternalIDAsync(externalId: string): Promise<T> {
        const where: any = {};
        where[this.externalIdField] = externalId;
        
        const result = await this.prisma[this.modelName].findUnique({
            where
        });
        
        if (!result) {
            throw new Error(`${this.modelName} with ${this.externalIdField} ${externalId} not found`);
        }
        
        return this.mapEntityToModel(result);
    }

    async getAllAsync(): Promise<T[]> {
        const results = await this.prisma[this.modelName].findMany();
        
        return results.map((result: any) => this.mapEntityToModel(result));
    }

    async saveAsync(entity: T): Promise<T> {
        const data = this.mapModelToEntity(entity);
        let result;
        
        if (entity.id) {
            // Update
            result = await this.prisma[this.modelName].update({
                where: { id: entity.id },
                data
            });
        } else {
            // Create
            result = await this.prisma[this.modelName].create({
                data
            });
        }
        
        return this.mapEntityToModel(result);
    }

    async purgeAsync(id: number): Promise<void> {
        await this.prisma[this.modelName].delete({
            where: { id }
        });
    }

    async purgeByExternalIDAsync(externalId: string): Promise<void> {
        const where: any = {};
        where[this.externalIdField] = externalId;
        
        await this.prisma[this.modelName].delete({
            where
        });
    }

    protected mapEntityToModel(entity: E): T {
        throw new Error('mapEntityToModel must be implemented by subclass');
    }

    protected mapModelToEntity(model: T): Partial<E> {
        throw new Error('mapModelToEntity must be implemented by subclass');
    }
} 