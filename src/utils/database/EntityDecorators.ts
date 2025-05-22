import 'reflect-metadata';
import { EntityRegistry, EntityInfo, FieldInfo, RelationType, RelationInfo } from './EntityRegistry';

export function Entity(tableName: string) {
  return function(target: any) {
    const entityName = target.name;
    const fields: FieldInfo[] = [];
    
    if (target.__fields__) {
      for (const [key, value] of Object.entries(target.__fields__)) {
        fields.push(value as FieldInfo);
      }
    }
    
    const entityInfo: EntityInfo = {
      name: entityName,
      tableName,
      fields
    };
    
    EntityRegistry.getInstance().registerEntity(entityInfo);
  };
}

export function Field() {
  return function(target: any, propertyKey: string) {
    target.constructor.__fields__ = target.constructor.__fields__ || {};
    
    let fieldInfo = target.constructor.__fields__[propertyKey] as FieldInfo;
    
    if (!fieldInfo) {
      fieldInfo = {
        name: propertyKey,
        type: Reflect.getMetadata('design:type', target, propertyKey)?.name.toLowerCase() || 'string',
        isOptional: false,
        isPrimary: false,
        isUnique: false,
        isRelation: false
      };
      
      target.constructor.__fields__[propertyKey] = fieldInfo;
    }
  };
}

export function PrimaryKey() {
  return function(target: any, propertyKey: string) {
    target.constructor.__fields__ = target.constructor.__fields__ || {};
    
    const fieldInfo: FieldInfo = {
      name: propertyKey,
      type: Reflect.getMetadata('design:type', target, propertyKey)?.name.toLowerCase() || 'string',
      isOptional: false,
      isPrimary: true,
      isUnique: false,
      isRelation: false
    };
    
    target.constructor.__fields__[propertyKey] = fieldInfo;
  };
}

export function Unique() {
  return function(target: any, propertyKey: string) {
    target.constructor.__fields__ = target.constructor.__fields__ || {};
    
    let fieldInfo = target.constructor.__fields__[propertyKey] as FieldInfo;
    
    if (!fieldInfo) {
      fieldInfo = {
        name: propertyKey,
        type: Reflect.getMetadata('design:type', target, propertyKey)?.name.toLowerCase() || 'string',
        isOptional: false,
        isPrimary: false,
        isUnique: true,
        isRelation: false
      };
    } else {
      fieldInfo.isUnique = true;
    }
    
    target.constructor.__fields__[propertyKey] = fieldInfo;
  };
}

export function Optional() {
  return function(target: any, propertyKey: string) {
    const existingFieldInfo = Reflect.getMetadata('fieldInfo', target, propertyKey) as FieldInfo || {
      name: propertyKey,
      type: Reflect.getMetadata('design:type', target, propertyKey)?.name.toLowerCase() || 'string',
      isOptional: false,
      isPrimary: false,
      isUnique: false,
      isRelation: false
    };
    
    existingFieldInfo.isOptional = true;
    
    Reflect.defineMetadata('fieldInfo', existingFieldInfo, target, propertyKey);
  };
}

export function OneToMany(targetEntity: string, inverseSide?: string) {
  return function(target: any, propertyKey: string) {
    target.constructor.__fields__ = target.constructor.__fields__ || {};
    
    let fieldInfo = target.constructor.__fields__[propertyKey] as FieldInfo;
    
    if (!fieldInfo) {
      fieldInfo = {
        name: propertyKey,
        type: Reflect.getMetadata('design:type', target, propertyKey)?.name.toLowerCase() || 'string',
        isOptional: false,
        isPrimary: false,
        isUnique: false,
        isRelation: true,
        relationInfo: {
          type: RelationType.ONE_TO_MANY,
          targetEntity,
          inverseSide
        }
      };
    } else {
      fieldInfo.isRelation = true;
      fieldInfo.relationInfo = {
        type: RelationType.ONE_TO_MANY,
        targetEntity,
        inverseSide
      };
    }
    
    target.constructor.__fields__[propertyKey] = fieldInfo;
  };
}

export function ManyToOne(targetEntity: string, inverseSide?: string, joinColumn?: string) {
  return function(target: any, propertyKey: string) {
    target.constructor.__fields__ = target.constructor.__fields__ || {};
    
    let fieldInfo = target.constructor.__fields__[propertyKey] as FieldInfo;
    
    if (!fieldInfo) {
      fieldInfo = {
        name: propertyKey,
        type: Reflect.getMetadata('design:type', target, propertyKey)?.name.toLowerCase() || 'string',
        isOptional: false,
        isPrimary: false,
        isUnique: false,
        isRelation: true,
        relationInfo: {
          type: RelationType.MANY_TO_ONE,
          targetEntity,
          inverseSide,
          joinColumn
        }
      };
    } else {
      fieldInfo.isRelation = true;
      fieldInfo.relationInfo = {
        type: RelationType.MANY_TO_ONE,
        targetEntity,
        inverseSide,
        joinColumn
      };
    }
    
    target.constructor.__fields__[propertyKey] = fieldInfo;
  };
}