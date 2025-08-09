import { TableEnum } from '../../src/interfaces/enums/database/TableEnum';

// For test cleanup order (respecting foreign keys)
export const CLEANUP_ORDER = [
    TableEnum.TIMELINE_ENTRIES,
    TableEnum.POINTS, 
    TableEnum.GAMES,
    TableEnum.USERS,
    TableEnum.SERVERS
];