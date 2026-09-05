import { createConnectionAsync, closeConnectionAsync } from '../../repositories/util/ConnectionHandler';
import { TableInterfaceGenerator } from './TableInterfaceGenerator';
import { StoredProcedureGenerator } from './StoredProcedureGenerator';
import { exportRoutines } from '../routines/Sync';
import { dumpSchemaAsync } from './SchemaDump';
import Logger from '../application/Logger';
import { getConfig } from '../application/Config';

// File information
const enumFileLocation = './src/interfaces/enums/';
const enumFile = 'index.ts';
const outputLocation = './src/interfaces/database/';
const outputFileName = 'TableInterfaces.ts';
const outputFilePath = outputLocation + outputFileName;

// Stored procedure/function enum information
const databaseEnumLocation = './src/interfaces/enums/database/';
const storedProcedureEnumFileName = 'StoredProcedureEnum.ts';
const functionEnumFileName = 'FunctionEnum.ts';
const storedProcedureEnumFilePath = databaseEnumLocation + storedProcedureEnumFileName;
const functionEnumFilePath = databaseEnumLocation + functionEnumFileName;

getConfig();

export async function createSchemaAsync() {
    try {
        await createConnectionAsync();

        await TableInterfaceGenerator.generateTableInterfacesAsync(
            outputFilePath,
            enumFileLocation,
            enumFile
        );
        
        await StoredProcedureGenerator.generateRoutineEnums(
            storedProcedureEnumFilePath,
            functionEnumFilePath
        );
        
        await exportRoutines();

        await dumpSchemaAsync();
    } catch (err) {
        Logger.logError(`Error generating schema: ${err}`);
    } finally {
        await closeConnectionAsync();
    }
}

export async function validateSchemaAsync(): Promise<void> {
    await TableInterfaceGenerator.generateTableInterfacesAsync(
        outputFilePath,
        enumFileLocation,
        enumFile,
        true
    );
}