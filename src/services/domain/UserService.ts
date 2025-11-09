import { UsersModel } from "../../interfaces/database/TableInterfaces";
import { BadgeEnum, ExceptionEnum, GameTypeEnum, UserRoleEnum } from "../../interfaces/enums";
import { ProfileGameView, ProfileView } from "../../interfaces/view";
import PointRepository from "../../repositories/PointRepository";
import UserRepository from "../../repositories/UserRepository";
import ServerService from "./ServerService";
import { getEnumDefaultsByValue } from "../../utils/helpers/Enum";
import { ErrorHelper } from "../../utils/application/Error";
import Logger from "../../utils/application/Logger";
import { User } from "../../interfaces/domain";
import GameService from "./GameService";

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

    public async getAllAsync(identity: User): Promise<UsersModel[]> {
        // TODO: Check permissions
        return await UserRepository.getAllAsync();
    }

    public async updateUsernameAsync(userId: string, username: string): Promise<UsersModel> {
        const user = await this.getByUserIdAsync(userId);
        if (!user)
            ErrorHelper.throw(ExceptionEnum.USER_NOT_FOUND);
        user.Username = username;
        Logger.logDebug(`Updated username to ${username} for user ${userId}`);
        return await UserRepository.saveAsync(user);
    }

    public async getUserProfileAsync(userId: string): Promise<ProfileView> {
        return await PointRepository.getUserProfileAsync(userId);
    }

    public async getUserGameProfileAsync(userId: string, gameId: number): Promise<ProfileGameView> {
        const gamePoints = await PointRepository.getPointsByUserIdAndGameIdAsync(userId, gameId);
        if (!gamePoints)
            return {
                gameName: GameService.getGameNameByType(gameId),
                gamePoints: 0,
                gameRank: 0,
                gameRankPlayerCount: 0,
            };

        return {
            gameName: GameService.getGameNameByType(gameId),
            gamePoints: gamePoints.Points,
            gameRank: 0,
            gameRankPlayerCount: 0,
        };
    }

    public async getSystemUserAsync(): Promise<User> {
        const user = await UserRepository.getSystemUserAsync();
        return await this.toModelAsync(user);
    }

    public async toModelAsync(user: UsersModel): Promise<User> {
        return {
            id: user.Id,
            userId: user.UserId,
            username: user.Username,
            displayName: user.Username,
            bot: user.UserRoleEnum === UserRoleEnum.SYSTEM,
            role: user.UserRoleEnum,
            hasPermissions: () => true,
            hasPermission: () => true,
            sendMessageAsync: async () => {},
        };
    }
}

export default new UserService();