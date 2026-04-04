import { UsersModel, UsersSaveModel, UsersModelFieldEnum } from "../../interfaces/database/TableInterfaces";
import { UserRoleEnum } from "../../interfaces/enums";
import { ProfileGameResponse, ProfileResponse } from "../../interfaces/view";
import PointRepository from "../../repositories/PointRepository";
import UserRepository from "../../repositories/UserRepository";
import Logger from "../../utils/application/Logger";
import { User } from "../../interfaces/domain";
import TimelineBuilder from "./TimelineBuilder";
import { InteractionEvent } from "../../interfaces/application";
import { BaseDomainService } from "./BaseDomainService";

class UserService extends BaseDomainService<UsersModel, UsersSaveModel, typeof UserRepository> {
    protected readonly repository = UserRepository;

    public async initAsync(): Promise<void> {
        const systemUser = await UserRepository.getSystemUserAsync();
        if (!systemUser)
            await UserRepository.saveAsync(new UsersSaveModel({
                UserId: 'SYSTEM',
                Username: 'System',
                UserRoleEnum: UserRoleEnum.SYSTEM,
            }));
    }

    protected async performSaveAsync(savable: UsersSaveModel, event: InteractionEvent): Promise<UsersModel> {
        savable.validateIsProvidedAndNotNull(UsersModelFieldEnum.UserId);
        savable.UserRoleEnum = UserRoleEnum.USER;

        const user = await UserRepository.saveAsync(savable);
        await TimelineBuilder.forUserUpdateAsync({
            old: null,
            new: user,
            objectId: user.Id,
            event: event
        });
        
        return user;
    }

    public async getAllAsync(): Promise<UsersModel[]> {
        return await UserRepository.getAllAsync();
    }

    public async purgeAsync(id: number): Promise<void> {
        await UserRepository.purgeAsync(id);
    }

    public async updateUsernameAsync(userId: string, username: string): Promise<UsersModel> {
        const user = await this.getByExternalIdAsync(userId);
        user.Username = username;
        Logger.logDebug(`Updated username to ${username} for user ${userId}`);
        return await UserRepository.saveAsync(user);
    }

    public async getUserProfileAsync(userId: string): Promise<ProfileResponse> {
        return await PointRepository.getUserProfileAsync(userId);
    }

    public async getUserGameProfileAsync(userId: string, serverId: string, gameId: number): Promise<ProfileGameResponse> {
        const entity = await this.getByExternalIdAsync(userId);
        const gamePoints = await PointRepository.getPointsByUserServerGameIdAsync(userId, serverId, gameId);
        const gameRank = await PointRepository.getGameRankAsync(userId, serverId, gameId);
        if (!gamePoints)
            return {
                username: entity.Username,
                gameType: gameId,
                gamePoints: 0,
                gameRank: gameRank.rank,
                gameRankPlayerCount: gameRank.total,
            } satisfies ProfileGameResponse;

        return {
            username: entity.Username,
            gameType: gameId,
            gamePoints: gamePoints.Points,
            gameRank: gameRank.rank,
            gameRankPlayerCount: gameRank.total,
        } satisfies ProfileGameResponse;
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