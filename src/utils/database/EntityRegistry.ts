export enum RelationType {
  ONE_TO_ONE = 'ONE_TO_ONE',
  ONE_TO_MANY = 'ONE_TO_MANY',
  MANY_TO_ONE = 'MANY_TO_ONE',
  MANY_TO_MANY = 'MANY_TO_MANY'
}

export interface FieldInfo {
  name: string;
  type: string;
  isOptional: boolean;
  isPrimary: boolean;
  isUnique: boolean;
  defaultValue?: any;
  isRelation: boolean;
  relationInfo?: RelationInfo;
}

export interface RelationInfo {
  type: RelationType;
  targetEntity: string;
  inverseSide?: string;
  joinColumn?: string;
  joinTable?: string;
}

export interface EntityInfo {
  name: string;
  tableName: string;
  fields: FieldInfo[];
}

export class EntityRegistry {
  private static instance: EntityRegistry;
  private entities: Map<string, EntityInfo> = new Map();
  
  private constructor() {}
  
  public static getInstance(): EntityRegistry {
    if (!EntityRegistry.instance) {
      EntityRegistry.instance = new EntityRegistry();
    }
    return EntityRegistry.instance;
  }
  
  public registerEntity(entityInfo: EntityInfo): void {
    this.entities.set(entityInfo.name, entityInfo);
  }
  
  public getEntities(): EntityInfo[] {
    return Array.from(this.entities.values());
  }
  
  public getEntity(name: string): EntityInfo | undefined {
    return this.entities.get(name);
  }
  
  public generatePrismaSchema(): string {
    let schema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

`;
    
    for (const entity of this.getEntities()) {
      schema += `model ${entity.name} {
`;
      
      const processedFields = new Set<string>();
      
      for (const field of entity.fields) {
        if (field.isRelation) continue;
        
        if (processedFields.has(field.name)) continue;
        processedFields.add(field.name);
        
        const typePart = this.getPrismaType(field.type);
        const optionalPart = field.isOptional ? '?' : '';
        const primaryPart = field.isPrimary ? ' @id' : '';
        const uniquePart = field.isUnique ? ' @unique' : '';
        const defaultPart = field.defaultValue !== undefined ? ` @default(${field.defaultValue})` : '';
        
        schema += `  ${field.name} ${typePart}${optionalPart}${primaryPart}${uniquePart}${defaultPart}\n`;
      }
      
      for (const field of entity.fields.filter(f => f.isRelation && f.relationInfo)) {
        if (processedFields.has(field.name)) continue;
        processedFields.add(field.name);
        
        const { relationInfo } = field;
        
        switch (relationInfo?.type) {
          case RelationType.ONE_TO_ONE:
            schema += `  ${field.name} ${relationInfo.targetEntity}${field.isOptional ? '?' : ''}\n`;
            break;
          case RelationType.ONE_TO_MANY:
            schema += `  ${field.name} ${relationInfo.targetEntity}[]\n`;
            break;
          case RelationType.MANY_TO_ONE: {
            const joinColumnName = relationInfo.joinColumn || field.name + 'Id';
            schema += `  ${field.name} ${relationInfo.targetEntity}${field.isOptional ? '?' : ''} @relation(fields: [${joinColumnName}], references: [id])\n`;
            
            if (!processedFields.has(joinColumnName)) {
              processedFields.add(joinColumnName);
              schema += `  ${joinColumnName} Int\n`;
            }
            break;
          }
          case RelationType.MANY_TO_MANY:
            schema += `  ${field.name} ${relationInfo.targetEntity}[] @relation("${relationInfo.joinTable || entity.name + relationInfo.targetEntity}")\n`;
            break;
        }
      }
      
      schema += `}\n\n`;
    }
    
    return schema;
  }
  
  private getPrismaType(type: string): string {
    switch (type) {
      case 'string':
        return 'String';
      case 'number':
        return 'Int';
      case 'boolean':
        return 'Boolean';
      case 'date':
        return 'DateTime';
      case 'Date':
        return 'DateTime';
      default:
        return 'String';
    }
  }
}