import { UsersModel, UsersSaveModel, UsersModelFieldEnum } from "../../interfaces/database/TableInterfaces";
import { MetricEnum, UserRoleEnum } from "../../interfaces/enums";
import { ProfileGameResponse, ProfileResponse } from "../../interfaces/view";
import PointRepository from "../../repositories/PointRepository";
import UserRepository from "../../repositories/UserRepository";
import EventRepository from "../../repositories/EventRepository";
import Logger from "../../utils/application/Logger";
import { User } from "../../interfaces/domain";
import TimelineBuilder from "./TimelineBuilder";
import { DurationEnum, InteractionEvent } from "../../interfaces/application";
import { BaseDomainService } from "./BaseDomainService";
import { TrackMetricPull } from "../../utils/helpers/Decorator";
import { calculateDuration } from "../../utils/helpers/Duration";
import ServerService from "./ServerService";

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

    public async addExperiencePointsAsync(userId: string, points: number): Promise<void> {
        const user = await this.getByExternalIdAsync(userId);
        user.ExperiencePoints += points;
        Logger.logDebug(`Added ${points} experience points to user ${userId}. Total experience is now ${user.ExperiencePoints}.`);
        await UserRepository.saveAsync(user);
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
            sendMessageAsync: async () => { },
        };
    }

    @TrackMetricPull(MetricEnum.Users)
    public async getTotalAsync() {
        return this.repository.getTotalAsync();
    }

    @TrackMetricPull(MetricEnum.AdoptionRate)
    public async getAdoptionRateAsync(): Promise<number> {
        const [allUsers, totalMembers] = await Promise.all([
            UserRepository.getAllAsync(),
            ServerService.getTotalServerMembersAsync(),
        ]);
        const userCount = allUsers.filter(u => u.UserRoleEnum !== UserRoleEnum.SYSTEM).length;
        if (totalMembers === 0)
            return 0;
        return Math.round((userCount / totalMembers) * 100) / 100;
    }

    @TrackMetricPull(MetricEnum.InactivityRate)
    public async getInactivityRateAsync(): Promise<number> {
        const thirtyDays = calculateDuration(30, DurationEnum.DAY);
        const [allUsers, activeIds] = await Promise.all([
            UserRepository.getAllAsync(),
            EventRepository.getActiveUserIdsInPeriodAsync(thirtyDays),
        ]);
        const users = allUsers.filter(u => u.UserRoleEnum !== UserRoleEnum.SYSTEM);
        if (users.length === 0)
            return 0;

        const inactive = users.filter(u => !activeIds.has(u.Id)).length;
        return Math.round((inactive / users.length) * 100) / 100;
    }
}

export default new UserService();