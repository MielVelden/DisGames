import {
    getUsersAchievementsFieldType,
    RepositoryWithBase,
    UsersAchievementsModel,
    UsersAchievementsModelFieldEnum,
    UsersAchievementsSaveModel,
} from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { BadgeEnum, TableEnum } from "../interfaces/enums";
import { getTableName, runExecuteAsync } from "./util/ConnectionHandler";
import { ProfileBadge } from "../interfaces/view";

class BadgeRepository implements RepositoryWithBase<UsersAchievementsModel, UsersAchievementsSaveModel, typeof UsersAchievementsModelFieldEnum> {
    public readonly baseRepository: BaseRepository<UsersAchievementsModel, UsersAchievementsSaveModel, typeof UsersAchievementsModelFieldEnum>;

    constructor() {
        this.baseRepository = new BaseRepository<UsersAchievementsModel, UsersAchievementsSaveModel, typeof UsersAchievementsModelFieldEnum>(
            TableEnum.USERS_ACHIEVEMENTS,
            UsersAchievementsModelFieldEnum,
            getUsersAchievementsFieldType,
        );
    }

    async getByIdAsync(id: number): Promise<UsersAchievementsModel | null> {
        return this.baseRepository.getById(id);
    }

    async getAllAsync(): Promise<UsersAchievementsModel[]> {
        return this.baseRepository.Select().Execute();
    }

    async saveAsync(model: UsersAchievementsSaveModel): Promise<UsersAchievementsModel> {
        return this.baseRepository.Save(model);
    }

    async purgeAsync(id: number): Promise<void> {
        await this.baseRepository.Delete(id);
    }

    // Loads every badge level the user currently holds, keyed by achievement.
    async getLevelsForUserAsync(userId: string): Promise<Map<BadgeEnum, number>> {
        const rows = await this.baseRepository.Select().Where({ UserId: userId }).Execute();
        const levels = new Map<BadgeEnum, number>();
        for (const row of rows)
            levels.set(row.AchievementEnum, row.Level);
        return levels;
    }

    async getProfileBadgesAsync(userId: string): Promise<ProfileBadge[]> {
        const rows = await this.baseRepository.Select().Where({ UserId: userId }).Execute();
        return rows.map(row => ({
            achievementEnum: row.AchievementEnum as BadgeEnum,
            date: row.CreatedAt,
            level: row.Level,
            threshold: 0,
        }));
    }

    async upsertLevelAsync(userId: string, achievement: BadgeEnum, level: number): Promise<boolean> {
        const table = getTableName(TableEnum.USERS_ACHIEVEMENTS);
        const query = `INSERT INTO ${table} (UserId, AchievementEnum, Level, CreatedAt) `
            + `VALUES (?, ?, ?, NOW()) `
            + `ON DUPLICATE KEY UPDATE Level = GREATEST(Level, VALUES(Level))`;
        const result = await runExecuteAsync(query, [userId, achievement, level]);
        const affectedRows = (result as unknown as { affectedRows?: number })?.affectedRows ?? 0;
        return affectedRows >= 1;
    }
}

export default new BadgeRepository();
