import TestRunner from '../../TestRunner';
import { TestSuite } from '../../interfaces/TestRunnerInterface';
import AssertionHelpers from '../../helpers/AssertionHelpers';
import { DatabaseHelper } from '../../../src/utils/database/DatabaseHelper';
import { BaseEntityFieldType } from '../../../src/interfaces/database/BaseEntity';
import { MultiLingualString } from '../../../src/utils/i18n/MultiLingualString';
import { LanguageEnum } from '../../../src/interfaces/enums/database/LanguageEnum';
import {
    DebugModelFieldEnum,
    getDebugFieldType,
    DatasheetsModelFieldEnum,
    getDatasheetsFieldType
} from '../../../src/interfaces/database/TableInterfaces';

function assertDeepEqual(actual: any, expected: any, message?: string): void {
    AssertionHelpers.assertEqual(JSON.stringify(actual), JSON.stringify(expected), message);
}

function assertHasOwn(entity: any, key: string, message?: string): void {
    AssertionHelpers.assertTrue(Object.prototype.hasOwnProperty.call(entity, key), message || `Expected key ${key} to be present`);
}

function assertNotHasOwn(entity: any, key: string, message?: string): void {
    AssertionHelpers.assertFalse(Object.prototype.hasOwnProperty.call(entity, key), message || `Expected key ${key} to be absent`);
}

export default function registerDatabaseHelperTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'DatabaseHelper',
        description: 'Characterization tests for JSON/MultiLingualString (de)serialization, pinned before refactoring serializeJsonFields to use fieldEnum/fieldType',

        tests: [
            // ---- serializeJsonFields ----
            {
                name: 'serializeJsonFields: merges the logical field into its JSON column only when the JSON column already has a defined value present',
                testFunction: async () => {
                    // The merge branch only fires when `serialized[key + 'JSON']` is not === undefined.
                    // A DataJSON key that is merely present-but-undefined does NOT trigger the merge.
                    const merged = DatabaseHelper.serializeJsonFields({ Id: 1, Data: { a: 1 }, DataJSON: null });
                    assertNotHasOwn(merged, 'Data');
                    assertHasOwn(merged, 'DataJSON');
                    assertDeepEqual(JSON.parse(merged.DataJSON), { a: 1 }, 'DataJSON should contain the stringified logical value, not the null placeholder');

                    const notMerged = DatabaseHelper.serializeJsonFields({ Id: 1, Data: { a: 1 }, DataJSON: undefined });
                    assertHasOwn(notMerged, 'Data', 'Data is left untouched when DataJSON is present but undefined');
                    AssertionHelpers.assertTrue(typeof notMerged.Data === 'object', 'Data stays an unstringified object in this case');
                }
            },
            {
                name: 'serializeJsonFields: stringifies an object passed directly under the JSON column name',
                testFunction: async () => {
                    const result = DatabaseHelper.serializeJsonFields({ Id: 1, DataJSON: { a: 1 } });

                    AssertionHelpers.assertEqual(typeof result.DataJSON, 'string', 'DataJSON should be a string');
                    assertDeepEqual(JSON.parse(result.DataJSON), { a: 1 });
                }
            },
            {
                name: 'serializeJsonFields: leaves an already-stringified JSON column untouched (no double encoding)',
                testFunction: async () => {
                    const alreadyEncoded = JSON.stringify({ a: 1 });
                    const result = DatabaseHelper.serializeJsonFields({ Id: 1, DataJSON: alreadyEncoded });

                    AssertionHelpers.assertEqual(result.DataJSON, alreadyEncoded, 'Should not re-stringify a string value');
                }
            },
            {
                name: 'serializeJsonFields: keeps explicit null on a JSON column (needed to clear the field in UPDATE)',
                testFunction: async () => {
                    const result = DatabaseHelper.serializeJsonFields({ Id: 1, DataJSON: null });

                    assertHasOwn(result, 'DataJSON');
                    AssertionHelpers.assertNull(result.DataJSON);
                }
            },
            {
                name: 'serializeJsonFields: keeps undefined on a JSON column (Save filters undefined fields itself)',
                testFunction: async () => {
                    const result = DatabaseHelper.serializeJsonFields({ Id: 1, DataJSON: undefined });

                    assertHasOwn(result, 'DataJSON');
                    AssertionHelpers.assertEqual(result.DataJSON, undefined);
                }
            },
            {
                name: 'serializeJsonFields: does not touch non-JSON fields',
                testFunction: async () => {
                    const now = new Date();
                    const result = DatabaseHelper.serializeJsonFields({ Id: 1, Name: 'foo', Count: 5, CreatedAt: now });

                    AssertionHelpers.assertEqual(result.Name, 'foo');
                    AssertionHelpers.assertEqual(result.Count, 5);
                    AssertionHelpers.assertTrue(result.CreatedAt === now, 'Date value should be passed through as-is');
                }
            },
            {
                name: 'serializeJsonFields: recognizes any key ending in "json" case-insensitively, not only known columns',
                testFunction: async () => {
                    const result = DatabaseHelper.serializeJsonFields({ Id: 1, attributesJson: { x: true } });

                    AssertionHelpers.assertEqual(typeof result.attributesJson, 'string');
                    assertDeepEqual(JSON.parse(result.attributesJson), { x: true });
                }
            },
            {
                name: 'serializeJsonFields: with fieldEnum/fieldType supplied, a non-JSON-typed field is never stringified even if its value happens to be an object',
                testFunction: async () => {
                    // UniqueCode is typed String on DebugModelFieldEnum; a caller accidentally handing it
                    // an object should not be treated as JSON just because it's not a primitive.
                    const result = DatabaseHelper.serializeJsonFields({ Id: 1, UniqueCode: { not: 'a string' } as any }, DebugModelFieldEnum, getDebugFieldType);

                    AssertionHelpers.assertTrue(typeof result.UniqueCode === 'object', 'Non-JSON-typed field must be left untouched regardless of runtime value');
                }
            },
            {
                name: 'serializeJsonFields: field/type-driven detection matches the suffix-only path for real generated columns',
                testFunction: async () => {
                    const entity = { Id: 1, DataJSON: { foo: 'bar' } };

                    const withoutFieldEnum = DatabaseHelper.serializeJsonFields(entity);
                    const withFieldEnum = DatabaseHelper.serializeJsonFields(entity, DebugModelFieldEnum, getDebugFieldType);

                    assertDeepEqual(withoutFieldEnum, withFieldEnum, 'Both detection paths should agree for a real DataJSON column');
                }
            },
            {
                name: 'serializeJsonFields: returns non-object input unchanged',
                testFunction: async () => {
                    AssertionHelpers.assertEqual(DatabaseHelper.serializeJsonFields(null), null);
                    AssertionHelpers.assertEqual(DatabaseHelper.serializeJsonFields(undefined), undefined);
                    AssertionHelpers.assertEqual(DatabaseHelper.serializeJsonFields('plain-string' as any), 'plain-string');
                }
            },

            // ---- serializeMultiLingualStrings ----
            {
                name: 'serializeMultiLingualStrings: converts a MultiLingualString instance into its MLS column',
                testFunction: async () => {
                    const mls = new MultiLingualString({ [LanguageEnum.EN]: 'Hello', [LanguageEnum.NL]: 'Hallo' });
                    const result = DatabaseHelper.serializeMultiLingualStrings(
                        { Id: 1, Name: mls },
                        DatasheetsModelFieldEnum,
                        getDatasheetsFieldType
                    );

                    assertNotHasOwn(result, 'Name');
                    assertHasOwn(result, 'NameMLS');
                    assertDeepEqual(JSON.parse(result.NameMLS), mls.toJSON());
                }
            },
            {
                name: 'serializeMultiLingualStrings: serializes a plain object on a field typed MultiLingualString',
                testFunction: async () => {
                    const raw = { [LanguageEnum.EN]: 'Hello' };
                    const result = DatabaseHelper.serializeMultiLingualStrings(
                        { Id: 1, Name: raw },
                        DatasheetsModelFieldEnum,
                        getDatasheetsFieldType
                    );

                    assertHasOwn(result, 'NameMLS');
                    assertDeepEqual(JSON.parse(result.NameMLS), raw);
                }
            },
            {
                name: 'serializeMultiLingualStrings: leaves non-MLS fields untouched',
                testFunction: async () => {
                    const result = DatabaseHelper.serializeMultiLingualStrings(
                        { Id: 1, ServerId: 42 },
                        DatasheetsModelFieldEnum,
                        getDatasheetsFieldType
                    );

                    AssertionHelpers.assertEqual(result.ServerId, 42);
                    assertNotHasOwn(result, 'ServerIdMLS');
                }
            },

            // ---- processEntityForDatabase (composition, using real generated enums) ----
            {
                name: 'processEntityForDatabase: serializes both JSON and MultiLingualString fields for a real generated model',
                testFunction: async () => {
                    const mls = new MultiLingualString({ [LanguageEnum.EN]: 'Hello' } as any);
                    const entity = { Id: 1, Name: mls, Description: mls };
                    const result = DatabaseHelper.processEntityForDatabase(entity, DatasheetsModelFieldEnum, getDatasheetsFieldType);

                    assertHasOwn(result, 'NameMLS');
                    assertHasOwn(result, 'DescriptionMLS');
                    assertNotHasOwn(result, 'Name');
                    assertNotHasOwn(result, 'Description');
                },
            },
            {
                name: 'processEntityForDatabase: serializes JSON fields for a real generated model (DebugSaveModel.DataJSON is stringified)',
                testFunction: async () => {
                    // DebugSaveModel (the shape BaseRepository.Save actually receives) only exposes
                    // DataJSON, not Data - fieldToPropertyMap maps the logical `Data` field onto it.
                    const entity = { Id: 1, UniqueCode: 'abc', DataJSON: { foo: 'bar' } };
                    const result = DatabaseHelper.processEntityForDatabase(entity, DebugModelFieldEnum, getDebugFieldType);

                    AssertionHelpers.assertEqual(result.UniqueCode, 'abc');
                    AssertionHelpers.assertEqual(typeof result.DataJSON, 'string');
                    assertDeepEqual(JSON.parse(result.DataJSON), { foo: 'bar' });
                },
            },
            {
                name: 'processEntityForDatabase: DataJSON round-trips through processResultsFromDatabase back to a plain object under Data',
                testFunction: async () => {
                    const entity = { Id: 1, UniqueCode: 'abc', DataJSON: { foo: 'bar', n: 2 } };
                    const forDb = DatabaseHelper.processEntityForDatabase(entity, DebugModelFieldEnum, getDebugFieldType);

                    // Simulate what MySQL would hand back: same keys, DataJSON as stored string
                    const fromDb = { Id: 1, UniqueCode: 'abc', DataJSON: forDb.DataJSON };
                    const [result] = DatabaseHelper.processResultsFromDatabase([fromDb]);

                    assertDeepEqual(result.Data, { foo: 'bar', n: 2 });
                    // deserializeJsonFields does not delete the source *JSON column; it adds Data alongside it
                    assertHasOwn(result, 'DataJSON');
                },
            },

            // ---- processResultsFromDatabase / deserializeJsonFields / deserializeMultiLingualStrings ----
            {
                name: 'deserializeJsonFields: parses a *JSON suffixed string column back to its logical name',
                testFunction: async () => {
                    const result = DatabaseHelper.deserializeJsonFields({ Id: 1, DataJSON: JSON.stringify({ a: 1 }) });

                    assertDeepEqual(result.Data, { a: 1 });
                    // current behavior: the JSON-suffixed column is left in place alongside the logical field
                    assertHasOwn(result, 'DataJSON');
                }
            },
            {
                name: 'deserializeJsonFields: silently skips an unparsable JSON column',
                testFunction: async () => {
                    const result = DatabaseHelper.deserializeJsonFields({ Id: 1, DataJSON: 'not-json' });

                    assertNotHasOwn(result, 'Data');
                    AssertionHelpers.assertEqual(result.DataJSON, 'not-json');
                }
            },
            {
                name: 'deserializeMultiLingualStrings: parses an MLS suffixed column into a MultiLingualString',
                testFunction: async () => {
                    const mls = new MultiLingualString({ [LanguageEnum.EN]: 'Hello', [LanguageEnum.NL]: 'Hallo' });
                    const result = DatabaseHelper.deserializeMultiLingualStrings({ Id: 1, NameMLS: JSON.stringify(mls.toJSON()) });

                    AssertionHelpers.assertNotNull(result.Name);
                    AssertionHelpers.assertTrue(result.Name instanceof MultiLingualString, 'Deserialized Name should be a MultiLingualString instance');
                    AssertionHelpers.assertEqual(result.Name.getMessage(LanguageEnum.EN), 'Hello');
                }
            },
            {
                name: 'processResultsFromDatabase: deserializes MLS and JSON columns together, non-array input returns empty array',
                testFunction: async () => {
                    const mls = new MultiLingualString({ [LanguageEnum.EN]: 'Hi' } as any);
                    const rows = [{ Id: 1, NameMLS: JSON.stringify(mls.toJSON()), DataJSON: JSON.stringify({ ok: true }) }];
                    const [result] = DatabaseHelper.processResultsFromDatabase(rows);

                    AssertionHelpers.assertTrue(result.Name instanceof MultiLingualString);
                    assertDeepEqual(result.Data, { ok: true });

                    assertDeepEqual(DatabaseHelper.processResultsFromDatabase(null as any), []);
                    assertDeepEqual(DatabaseHelper.processResultsFromDatabase({} as any), []);
                }
            },

            // ---- transformDatabaseKeys / processStoredProcedureResults ----
            {
                name: 'transformDatabaseKeys: PascalCases lowercase keys',
                testFunction: async () => {
                    const result = DatabaseHelper.transformDatabaseKeys({ id: 1, uniqueCode: 'abc' });

                    assertDeepEqual(result, { Id: 1, UniqueCode: 'abc' });
                }
            },
            {
                name: 'processStoredProcedureResults: transforms keys then deserializes MLS/JSON fields from the first result set',
                testFunction: async () => {
                    const mls = new MultiLingualString({ [LanguageEnum.EN]: 'Hi' } as any);
                    const results = [[{ id: 1, nameMLS: JSON.stringify(mls.toJSON()), dataJSON: JSON.stringify({ ok: true }) }]];
                    const [result] = DatabaseHelper.processStoredProcedureResults(results);

                    AssertionHelpers.assertTrue(result.Name instanceof MultiLingualString);
                    assertDeepEqual(result.Data, { ok: true });
                }
            },
            {
                name: 'processStoredProcedureResults: returns empty array when the first result set is missing or not an array',
                testFunction: async () => {
                    assertDeepEqual(DatabaseHelper.processStoredProcedureResults(null as any), []);
                    assertDeepEqual(DatabaseHelper.processStoredProcedureResults([]), []);
                    assertDeepEqual(DatabaseHelper.processStoredProcedureResults([{} as any]), []);
                }
            },

            // ---- the TestDatabase stub path: synthetic identity fieldEnum + constant fieldType ----
            {
                name: 'processEntityForDatabase: still serializes *JSON suffixed keys when given a stub fieldTypeFunction that never reports Json (matches tests/config/TestDatabase.ts usage)',
                testFunction: async () => {
                    const data = { Id: 1, SettingsJSON: { level: 3 } };
                    const fieldEnum = Object.fromEntries(Object.keys(data).map(k => [k, k]));
                    const result = DatabaseHelper.processEntityForDatabase(data, fieldEnum, () => BaseEntityFieldType.String);

                    AssertionHelpers.assertEqual(typeof result.SettingsJSON, 'string', 'Suffix-based detection must still catch this even though fieldTypeFunction never returns Json');
                    assertDeepEqual(JSON.parse(result.SettingsJSON), { level: 3 });
                }
            }
        ]
    };

    runner.addSuite(suite);
}
