import { UsersModel } from "../../interfaces/database/TableInterfaces";
import { BadgeEnum, ExceptionEnum, GameTypeEnum, UserRoleEnum } from "../../interfaces/enums";
import { ProfileView } from "../../interfaces/view";
import PointRepository from "../../repositories/PointRepository";
import UserRepository from "../../repositories/UserRepository";
import ServerService from "./ServerService";
import { getEnumDefaultsByValue } from "../../utils/helpers/Enum";
import { ErrorHelper } from "../../utils/application/Error";
import Logger from "../../utils/application/Logger";
import { User } from "../../interfaces/domain";

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
        const user = await this.getByUserIdAsync(userId);
        const gamePoints = await PointRepository.getPointsAsync(userId);
        if (!gamePoints) {
            return {
                userId: user.UserId,
                username: user.Username,
                totalPoints: 0,
                mostPlayedServerId: 0,
                gamePoints: getEnumDefaultsByValue(GameTypeEnum, 0),
                badges: getEnumDefaultsByValue(BadgeEnum, false),
            };
        }

        const server = await ServerService.getServerAsync(gamePoints.ServerId);

        return {
            userId: user.UserId,
            username: user.Username,
            totalPoints: gamePoints?.Points ?? 0,
            mostPlayedServerId: server.Id,
            gamePoints: {
                [GameTypeEnum.ANAGRAM]: gamePoints?.GameId === GameTypeEnum.ANAGRAM ? gamePoints?.Points : 0,
                [GameTypeEnum.WORD_SNAKE]: gamePoints?.GameId === GameTypeEnum.WORD_SNAKE ? gamePoints?.Points : 0,
                [GameTypeEnum.COUNTING]: 0,
                [GameTypeEnum.NUMBER_GUESS]: 0,
                [GameTypeEnum.TRIVIA_QUIZ]: 0,
                [GameTypeEnum.GUESS_THE_PRICE]: 0,
                [GameTypeEnum.MATH_QUIZ]: 0,
                [GameTypeEnum.GUESS_THE_FLAG]: 0,
                [GameTypeEnum.CONNECTIONS]: 0,
            },
            badges: {
                [BadgeEnum.EARLY_BIRD]: gamePoints?.GameId === GameTypeEnum.ANAGRAM ? true : false,
                [BadgeEnum.TESTER]: gamePoints?.GameId === GameTypeEnum.WORD_SNAKE ? true : false,
            },
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