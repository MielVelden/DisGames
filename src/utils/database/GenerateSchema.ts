import { DatabaseConnection } from './DatabaseConnection';
import { TableInterfaceGenerator } from './TableInterfaceGenerator';
import { StoredProcedureGenerator } from './StoredProcedureGenerator';
import { DatabaseEnumManager } from './DatabaseEnumManager';
import { RoutineSyncService } from '../routines/RoutineSyncService';
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

async function main() {
    try {
        await DatabaseConnection.createConnection();
        
        await TableInterfaceGenerator.generateTableInterfaces(
            outputFilePath,
            enumFileLocation,
            enumFile
        );
        
        await StoredProcedureGenerator.generateRoutineEnums(
            storedProcedureEnumFilePath,
            functionEnumFilePath
        );
        
        await DatabaseEnumManager.updateDatabaseWithEnums();

        await RoutineSyncService.exportRoutines();
    } catch (err) {
        Logger.logError(`Error generating schema: ${err}`);
    } finally {
        await DatabaseConnection.closeConnection();
    }
}

main();