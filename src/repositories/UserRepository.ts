import { getUsersFieldType, RepositoryWithBase, UsersModel, UsersModelFieldEnum, UsersSaveModel } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { TableEnum, UserRoleEnum } from "../interfaces/enums/index";
import { StoredProcedureEnum } from "../interfaces/enums/database/StoredProcedureEnum";
import { UserLeaderboardRow } from "../interfaces/view";

class UserRepository implements RepositoryWithBase<UsersModel, UsersSaveModel, typeof UsersModelFieldEnum> {
    public readonly baseRepository: BaseRepository<UsersModel, UsersSaveModel, typeof UsersModelFieldEnum>;

    constructor() {
        this.baseRepository = new BaseRepository<UsersModel, UsersSaveModel, typeof UsersModelFieldEnum>(
            TableEnum.USERS,
            UsersModelFieldEnum,
            getUsersFieldType,
        );
    }

    async getByIdAsync(id: number): Promise<UsersModel | null> {
        return this.baseRepository.getById(id);
    }

    async getAllAsync(): Promise<UsersModel[]> {
        return this.baseRepository.Select().Execute();
    }

    async saveAsync(model: UsersSaveModel): Promise<UsersModel> {
        return this.baseRepository.Save(model);
    }

    async purgeAsync(id: number): Promise<void> {
        await this.baseRepository.Delete(id);
    }

    async getByUserIdAsync(userId: string): Promise<UsersModel> {
        const model = await this.baseRepository.Select().Where({ UserId: userId }).Limit(1).Execute();
        return model[0];
    }

    async getTotalAsync(): Promise<number> {
        const total = await this.baseRepository.Select().Count();
        return total;
    }

    async getSystemUserAsync(): Promise<UsersModel> {
        const model = await this.baseRepository.Select().Where({ UserRoleEnum: UserRoleEnum.SYSTEM }).Limit(1).Execute();
        return model[0];
    }

    async getTopUsersByExperienceAsync(limit: number = 5): Promise<UserLeaderboardRow[]> {
        return this.baseRepository.CallStoredProcedure(StoredProcedureEnum.GetTopUsersByExperience, [limit]);
    }
}

export default new UserRepository();