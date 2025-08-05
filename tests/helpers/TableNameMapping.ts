import { TableEnum } from '../../src/interfaces/enums/database/TableEnum';

export const TABLE_NAMES = {
    [TableEnum.SERVERS]: 'servers',
    [TableEnum.GAMES]: 'games', 
    [TableEnum.GAME_DATA]: 'game_data',
    [TableEnum.POINTS]: 'points',
    [TableEnum.USERS]: 'users',
    [TableEnum.DATASHEETS]: 'datasheets',
    [TableEnum.GAMESXDATASHEETS]: 'gamesxdatasheets',
    [TableEnum.TIMELINE_ENTRIES]: 'timeline_entries'
};

export function getTableName(tableEnum: TableEnum): string {
    return TABLE_NAMES[tableEnum];
}

// For test cleanup order (respecting foreign keys)
export const CLEANUP_ORDER = [
    TableEnum.TIMELINE_ENTRIES,
    TableEnum.POINTS, 
    TableEnum.GAMES,
    TableEnum.USERS,
    TableEnum.SERVERS
];