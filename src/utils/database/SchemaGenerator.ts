import * as fs from 'fs';
import * as path from 'path';
import { EntityRegistry } from './EntityRegistry';

export class SchemaGenerator {
  public static generateSchema(outputPath: string = './prisma/schema.prisma'): void {
  
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const schema = EntityRegistry.getInstance().generatePrismaSchema();
    
    fs.writeFileSync(outputPath, schema);
    
    console.log(`Prisma scheme written to ${outputPath}`);
  }
} 