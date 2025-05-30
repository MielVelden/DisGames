import { UsersModel, UsersSaveModel } from "../interfaces/database";
import BaseRepository from "./BaseRepository.js";
import { TableEnum } from "../interfaces/enums/index.js";

class UserRepository {
    private baseRepository: BaseRepository<UsersModel, UsersSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<UsersModel, UsersSaveModel>(TableEnum.USERS);
    }

    async getAllUsersAsync(): Promise<UsersModel[]> {
        return this.baseRepository.Select().Execute();
    }

    async getByUserIdAsync(userId: string): Promise<UsersModel> {
        const model = await this.baseRepository.Select().Where({ UserId: userId }).Limit(1).Execute();
        return model[0];
    }

    async getUserByIdAsync(id: number) {
        const model = await this.baseRepository.Select().Where({ Id: id }).Limit(1).Execute();
        return model[0];
    }

    async save(model: UsersSaveModel): Promise<UsersModel> {
        return this.baseRepository.Save(model);
    }
}

export default new UserRepository();