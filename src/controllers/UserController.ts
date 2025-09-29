import { Controller } from "../interfaces/application/Controller";
import { UsersModel } from "../interfaces/database";
import { User } from "../interfaces/domain";
import UserService from "../services/UserService";

class UserController implements Controller {
    async getByIdAsync(discordUserId: string, identity: User): Promise<UsersModel> {
        const user = await UserService.getByUserIdAsync(discordUserId);
        return user;
    }

    async getAllAsync(identity: User): Promise<UsersModel[]> {
        const users = await UserService.getAllAsync(identity);
        return users;
    }
}

export default UserController;