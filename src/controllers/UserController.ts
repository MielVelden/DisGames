import { Controller } from "../interfaces/application/Controller";
import { UsersModel } from "../interfaces/database";
import { User } from "../interfaces/domain";
import UserService from "../services/domain/UserService";
import { UserResponse } from "../interfaces/view/User";

function toUserViewModel(model: UsersModel): UserResponse {
    return {
        UserId: model.UserId,
        Username: model.Username,
        UserRoleEnum: model.UserRoleEnum,
        ExperiencePoints: model.ExperiencePoints,
        StreakDays: model.StreakDays,
        GamesPlayed: model.GamesPlayed,
        CreatedAt: model.CreatedAt,
        UpdatedAt: model.UpdatedAt,
    };
}

class UserController implements Controller {
    async getByIdAsync(discordUserId: string, identity: User): Promise<UserResponse> {
        const user = await UserService.getByExternalIdAsync(discordUserId);
        return toUserViewModel(user);
    }

    async getAllAsync(identity: User): Promise<UserResponse[]> {
        const users = await UserService.getAllAsync();
        return users.map(toUserViewModel);
    }
}

export default UserController;
