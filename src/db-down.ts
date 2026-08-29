import 'reflect-metadata';
import { createSchemaAsync } from './utils/database/GenerateSchema';

// If this file is run directly, execute the function
if (require.main === module) {
    createSchemaAsync().catch(console.error);
} 
