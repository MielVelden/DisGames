import { TableEnum } from "../../interfaces/enums";
import { RepositoryUtils } from "../../repositories/BaseRepository";
import { FunctionEnum } from "../../interfaces/enums/database/FunctionEnum";

export async function formatEmbedFieldValueAsync(value: unknown, table?: TableEnum): Promise<string> {
    if (value === null || value === undefined)
        return 'N/A';

    if (typeof value === 'object') {
        const json = JSON.stringify(value, null, 2) ?? '{}';
        const clipped = json.length > 1000 ? json.slice(0, 1000) + '…' : json;
        return '```json\n' + clipped + '\n```';
    }

    const str = String(value);
    if (table) {
        const result = await RepositoryUtils.CallFunctionGeneric(FunctionEnum.GetDisplayName, [table, value]);
        return `${result} (${str})`;
    }

    return str.length > 1024 ? str.slice(0, 1021) + '…' : str;
}

