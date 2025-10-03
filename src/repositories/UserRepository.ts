import { Repository, UsersModel, UsersModelFieldEnum, UsersSaveModel } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { TableEnum } from "../interfaces/enums/index";

class UserRepository implements Repository<UsersModel> {
    private baseRepository: BaseRepository<UsersModel, UsersSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<UsersModel, UsersSaveModel>(TableEnum.USERS, UsersModelFieldEnum);
    }

    async getByIDAsync(id: number): Promise<UsersModel | null> {
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

    async getTotalUsersAsync(): Promise<number> {
        const total = await this.baseRepository.Select().Count();
        return total;
    }
}

export default new UserRepository();