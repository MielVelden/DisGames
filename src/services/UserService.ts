import { UsersModel } from "../interfaces/database/TableInterfaces";
import UserRepository from "../repositories/UserRepository";

class UserService {
    public async getByUserIdAsync(userId: string, createIfNotExists: boolean = false): Promise<UsersModel> {
        const user = await UserRepository.getByUserIdAsync(userId);
        if (!user && createIfNotExists) {
            return await UserRepository.saveAsync({
                UserId: userId,
                Username: userId,
            });
        }

        return user;
    }
}

export default new UserService();