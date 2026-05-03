import { runQueryAsync, getDatabaseName } from '../../repositories/util/ConnectionHandler';
import Logger from '../application/Logger';
import { RoutineType, RoutineDefinition, ROUTINE_KEYWORDS } from '../../interfaces/database/RoutineSync';
import { ensureDirectories, writeRoutineFile, readRoutineFiles, wrapForSync, parseCreateBody } from './Helper';

export async function exportRoutines(): Promise<void> {
  ensureDirectories();

  const query = `
      SELECT ROUTINE_NAME, ROUTINE_TYPE
      FROM information_schema.ROUTINES
      WHERE ROUTINE_SCHEMA = ?
      AND ROUTINE_TYPE IN ('PROCEDURE', 'FUNCTION')
      ORDER BY ROUTINE_TYPE, ROUTINE_NAME
    `;

  const routineList = await runQueryAsync(query, [getDatabaseName()]) as Array<{ ROUTINE_NAME: string; ROUTINE_TYPE: string }>;

  let procedureCount = 0;
  let functionCount = 0;

  for (const routine of routineList) {
    const routineType = routine.ROUTINE_TYPE === 'FUNCTION' ? RoutineType.Function : RoutineType.Procedure;
    const keyword = ROUTINE_KEYWORDS[routineType];
    const name = routine.ROUTINE_NAME;

    const showQuery = `SHOW CREATE ${keyword} \`${name}\``;
    const rows = await runQueryAsync(showQuery);
    const row = rows?.[0];

    const body = parseCreateBody(row);
    if (!body) {
      Logger.logWarning(`Skipping ${keyword} ${name}: SHOW CREATE returned null (insufficient privileges)`);
      continue;
    }

    const definition: RoutineDefinition = { name, type: routineType, body };
    writeRoutineFile(definition);

    if (routineType === RoutineType.Procedure)
      procedureCount++;
    else
      functionCount++;

    Logger.logInfo(`Exported ${keyword} ${name}`);
  }

  Logger.logInfo(`Routine export complete: ${procedureCount} procedures, ${functionCount} functions`);
}

export async function syncRoutines(): Promise<void> {
  const procedures = readRoutineFiles(RoutineType.Procedure);
  const functions = readRoutineFiles(RoutineType.Function);
  const allRoutines = [...procedures, ...functions];

  if (allRoutines.length === 0) {
    Logger.logInfo('No routine files found, skipping sync');
    return;
  }

  for (const routine of allRoutines) {
    const keyword = ROUTINE_KEYWORDS[routine.type];
    const { drop, create } = wrapForSync(routine);

    await runQueryAsync(drop);
    await runQueryAsync(create);

    Logger.logInfo(`Synced ${keyword} ${routine.name}`);
  }

  Logger.logInfo(`Routine sync complete: ${procedures.length} procedures, ${functions.length} functions`);
}
