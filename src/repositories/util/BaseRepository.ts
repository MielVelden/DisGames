import { PrismaClient } from '@prisma/client';
import { Repository } from '../../interfaces/database/Repository';
import { getPrismaInstance } from './prisma';
import { IEntity } from '../../interfaces/database/IEntity';

export class BaseRepository<T extends IEntity> implements Repository<T> {
    protected prisma: PrismaClient;
    protected modelName: string;
    protected externalIdField: string;
    
    constructor(modelName: string, externalIdField: string) {
        this.prisma = getPrismaInstance();
        this.modelName = modelName;
        this.externalIdField = externalIdField;
    }

    async getByIDAsync(id: number): Promise<T> {
        const result = await (this.prisma[this.modelName] as any).findUnique({
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
        
        const result = await (this.prisma[this.modelName] as any).findUnique({
            where
        });
        
        if (!result) {
            throw new Error(`${this.modelName} with ${this.externalIdField} ${externalId} not found`);
        }
        
        return this.mapEntityToModel(result);
    }

    async getAllAsync(): Promise<T[]> {
        const results = await (this.prisma[this.modelName] as any).findMany();
        
        return results.map((result: any) => this.mapEntityToModel(result));
    }

    async saveAsync(entity: T): Promise<T> {
        const data = this.mapModelToEntity(entity);
        let result;
        
        if (entity.id) {
            // Update
            result = await (this.prisma[this.modelName] as any).update({
                where: { id: entity.id },
                data
            });
        } else {
            // Create
            result = await (this.prisma[this.modelName] as any).create({
                data
            });
        }
        
        return this.mapEntityToModel(result);
    }

    async purgeAsync(id: number): Promise<void> {
        await (this.prisma[this.modelName] as any).delete({
            where: { id }
        });
    }

    async purgeByExternalIDAsync(externalId: string): Promise<void> {
        const where: any = {};
        where[this.externalIdField] = externalId;
        
        await (this.prisma[this.modelName] as any).delete({
            where
        });
    }

    // Dit moet worden geïmplementeerd door subklassen
    protected mapEntityToModel(entity: any): T {
        throw new Error('mapEntityToModel must be implemented by subclass');
    }

    // Dit moet worden geïmplementeerd door subklassen
    protected mapModelToEntity(model: T): any {
        throw new Error('mapModelToEntity must be implemented by subclass');
    }
} 