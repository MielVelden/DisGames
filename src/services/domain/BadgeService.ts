import * as fs from "fs";
import * as path from "path";
import { InteractionEvent } from "../../interfaces/application";
import { BadgeContext, BadgeModule, BadgeResult } from "../../interfaces/domain/Badge";
import { BadgeEnum, BadgeTriggerEnum } from "../../interfaces/enums";
import { UsersModel } from "../../interfaces/database/TableInterfaces";
import BadgeRepository from "../../repositories/BadgeRepository";
import UserRepository from "../../repositories/UserRepository";
import PointRepository from "../../repositories/PointRepository";
import Logger from "../../utils/application/Logger";
import ComponentService from "../application/ComponentService";
import { ComponentVisibility } from "../../interfaces/application/Message";
import BadgeCard from "../../builders/cards/BadgeCard";
import { getConfigValue } from "../../utils/application/Config";
import { EnvConfigEnum } from "../../interfaces/enums/application/EnvConfigEnum";
import { Service } from "../../interfaces/application/Service";
import { registerService } from "../../utils/container/Container";

export class BadgeService extends Service {
    private badges: BadgeModule[] = [];

    public async initAsync(): Promise<void> {
        await this.loadBadgesAsync();
    }

    private async loadBadgesAsync(): Promise<void> {
        const badgesPath = path.join(__dirname, '..', 'badges');

        try {
            const badgeFiles = fs.readdirSync(badgesPath).filter(file =>
                file.endsWith('.ts') || file.endsWith('.js')
            );

            for (const file of badgeFiles) {
                try {
                    const badgePath = path.join(badgesPath, file);
                    const badgeModule = require(badgePath).default as BadgeModule;

                    if (badgeModule && badgeModule.config && typeof badgeModule.evaluate === 'function')
                        this.badges.push(badgeModule);
                } catch (error) {
                    Logger.logError(`Error loading badge file ${file}:`, error as Error);
                }
            }
        } catch (error) {
            Logger.logError('Error loading badges directory:', error as Error);
        }
    }

    public getBadges(): BadgeModule[] {
        return this.badges;
    }

    public getThresholdForLevel(achievementEnum: BadgeEnum, level: number): number {
        const badge = this.badges.find(b => b.config.id === achievementEnum);
        return badge?.config.tiers.find(t => t.level === level)?.threshold ?? level;
    }

    public async evaluateAll(event: InteractionEvent, trigger: BadgeTriggerEnum): Promise<BadgeResult[]> {
        // TODO: Disable this in production
        if(getConfigValue(EnvConfigEnum.IS_PRODUCTION)) 
            return [];

        const context = this.createBadgeContext(event, trigger);
        const stored = await BadgeRepository.getLevelsForUserAsync(context.userId);
        const earned: BadgeResult[] = [];

        const subscribed = this.badges.filter(badge => badge.config.triggers.includes(trigger));
        for (const badge of subscribed) {
            try {
                const achieved = await badge.evaluate(context);
                if (achieved === null)
                    continue;

                const current = stored.get(badge.config.id) ?? 0;
                if (achieved <= current)
                    continue;

                const changed = await BadgeRepository.upsertLevelAsync(context.userId, badge.config.id, achieved);
                if (changed) {
                    earned.push({ achievement: badge.config.id, level: achieved, isNew: true });
                    const threshold = badge.config.tiers.find(t => t.level === achieved)?.threshold ?? achieved;
                    const media = await BadgeCard.generateAsync({
                        userId: context.userId,
                        badge: { achievementEnum: badge.config.id, date: new Date(), level: achieved, threshold },
                    });

                    const badgeImage = ComponentService.createImage(media, false);
                    badgeImage.visibility = ComponentVisibility.PRIVATE;

                    await event.addComponentsAsync([
                        badgeImage,
                        ...(event.components.length ? [ComponentService.createSeparator()] : [])
                    ], true);
                }
            } catch (error) {
                Logger.logError(`Error evaluating badge ${badge.config.id}:`, error as Error);
            }
        }

        return earned;
    }

    private createBadgeContext(event: InteractionEvent, trigger: BadgeTriggerEnum): BadgeContext {
        const userId = event.user.userId;
        const guildId = event.guildId;

        let userModel: UsersModel | undefined;
        let totalPointsCache: number | undefined;
        let distinctServersCache: number | undefined;

        const loadUserAsync = async (): Promise<UsersModel> =>
            userModel ??= await UserRepository.getByUserIdAsync(userId);

        return {
            userId,
            guildId,
            trigger,
            async streakDays(): Promise<number> {
                const user = await loadUserAsync();
                return user.StreakDays ?? 0;
            },
            async gamesPlayed(): Promise<number> {
                const user = await loadUserAsync();
                return user.GamesPlayed ?? 0;
            },
            async totalPoints(): Promise<number> {
                return totalPointsCache ??= (await PointRepository.getUserProfileAsync(userId)).TotalPoints;
            },
            async accountAgeDays(): Promise<number> {
                const user = await loadUserAsync();
                const ms = Date.now() - new Date(user.CreatedAt).getTime();
                return Math.floor(ms / 86_400_000);
            },
            async distinctServers(): Promise<number> {
                return distinctServersCache ??= await PointRepository.getDistinctServerCountAsync(userId);
            },
        };
    }
}

const badgeService = new BadgeService();
registerService(badgeService);
export default badgeService;
