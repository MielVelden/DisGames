import { Controller } from "../interfaces/application/Controller";
import { UsersModel } from "../interfaces/database";
import { User } from "../interfaces/domain";
import UserRepository from "../repositories/UserRepository";

class UserController implements Controller {
    async getByIdAsync(id: string, identity: User): Promise<UsersModel> {
        const user = await UserRepository.getByUserIdAsync(id);
        return user;
    }

    async getAllAsync(identity: User): Promise<UsersModel[]> {
        const users = await UserRepository.getAllAsync();
        return users;
    }
}

export default UserController;