import { TableEnum, TimelineTypeEnum } from "../interfaces/enums";
import { TimelineChanges } from "../interfaces/domain/Timeline";
import TimelineRepository from "../repositories/TimelineRepository";
import { TimelineEntriesSaveModel } from "../interfaces/database";
import { InteractionEvent } from "../interfaces/application/Event";
import UserRepository from "../repositories/UserRepository";
import ServerRepository from "../repositories/ServerRepository";
import GameRepository from "../repositories/GameRepository";
import Logger from "../utils/Logger";

interface TimelineContext {
   event: InteractionEvent;
   old: any;
   new: any;
   objectId: number;
}

class TimelineBuilder {

    private detectChanges(oldObject: any, newObject: any): TimelineChanges {
        const changes: TimelineChanges = {};
        
        if (!newObject) {
            return changes;
        }

        if (!oldObject) {
            for (const key of Object.keys(newObject)) {
                const newValue = newObject[key];
                if (newValue !== null && newValue !== undefined) {
                    changes[key] = {
                        from: null,
                        to: newValue
                    };
                }
            }
            return changes;
        }

        const allKeys = new Set([...Object.keys(oldObject), ...Object.keys(newObject)]);
        
        for (const key of allKeys) {
            const oldValue = oldObject[key];
            const newValue = newObject[key];
            
            if (this.hasChanged(oldValue, newValue)) {
                changes[key] = {
                    from: oldValue,
                    to: newValue
                };
            }
        }
        
        return changes;
    }

    private hasChanged(oldValue: any, newValue: any): boolean {
        if (oldValue === newValue) 
            return false;
            
        if (oldValue === null || oldValue === undefined) 
            return newValue !== null && newValue !== undefined;
                
        if (newValue === null || newValue === undefined) 
            return true;

        if (typeof oldValue === 'object' && typeof newValue === 'object') 
            return JSON.stringify(oldValue) !== JSON.stringify(newValue);
        
        return oldValue !== newValue;
    }

    private async createTimelineEntryAsync(
        table: TableEnum,
        objectId: number,
        timelineType: TimelineTypeEnum,
        changes: TimelineChanges,
        context: TimelineContext
    ): Promise<void> {
        const user = await UserRepository.getByUserIdAsync(context.event.user.userId);
        const server = await ServerRepository.getByServerIdAsync(context.event.server.ServerId);

        if(!user || !server)
            return;

        const timelineEntry: TimelineEntriesSaveModel = {
            TableEnum: table,
            ObjectId: objectId,
            TimelineType: timelineType,
            UserId: user.Id!,
            ServerId: server.Id!,
            ChangesJSON: changes
        };

        context.event.addTimelineEntry(timelineEntry);
    }

    async forGameUpdateAsync(context: TimelineContext): Promise<void> {
        const changes = this.detectChanges(context.old, context.new);
        
        const timelineType = context.old ? TimelineTypeEnum.GAME_UPDATED : TimelineTypeEnum.GAME_CREATED;
        
        await this.createTimelineEntryAsync(
            TableEnum.GAMES,
            context.objectId,
            timelineType,
            changes,
            context
        );
    }

    async forGameResetAsync(gameId: number, context: TimelineContext): Promise<void> {
        const game = await GameRepository.getByIDAsync(gameId);
        if (!game) 
            throw new Error('Game not found');

        const changes = this.detectChanges(game, context.new);
        
        await this.createTimelineEntryAsync(
            TableEnum.GAMES,
            gameId,
            TimelineTypeEnum.GAME_RESET,
            changes,
            context
        );
    }

    async forGamePlayedAsync(gameId: number, context: TimelineContext): Promise<void> {
        await this.createTimelineEntryAsync(
            TableEnum.GAMES,
            gameId,
            TimelineTypeEnum.GAME_PLAYED,
            {},
            context
        );
    }

    async forGameDeletedAsync(gameId: number, context: TimelineContext): Promise<void> {
        await this.createTimelineEntryAsync(
            TableEnum.GAMES,
            gameId,
            TimelineTypeEnum.GAME_DELETED,
            {},
            context
        );
    }

    async forUserUpdateAsync(context: { old: any; new: any; objectId: number; } & TimelineContext): Promise<void> {
        const changes = this.detectChanges(context.old, context.new);
        
        const timelineType = context.old ? TimelineTypeEnum.USER_UPDATED : TimelineTypeEnum.USER_CREATED;
        
        await this.createTimelineEntryAsync(
            TableEnum.USERS,
            context.objectId,
            timelineType,
            changes,
            context
        );
    }

    async forServerUpdateAsync(context: { old: any; new: any; objectId: number; } & TimelineContext): Promise<void> {
        const changes = this.detectChanges(context.old, context.new);
        
        const timelineType = context.old ? TimelineTypeEnum.SERVER_UPDATED : TimelineTypeEnum.SERVER_CREATED;
        
        await this.createTimelineEntryAsync(
            TableEnum.SERVERS,
            context.objectId,
            timelineType,
            changes,
            context
        );
    }

    async forPointsAddedAsync(pointsId: number, context: TimelineContext): Promise<void> {
        await this.createTimelineEntryAsync(
            TableEnum.POINTS,
            pointsId,
            TimelineTypeEnum.POINTS_ADDED,
            {},
            context
        );
    }

    async commitTimelineEntriesAsync(entries: TimelineEntriesSaveModel[]): Promise<void> {
        if (entries.length === 0)
            return;

        try {
            await Promise.all(entries.map(entry => {
                TimelineRepository.saveAsync(entry);
                Logger.logTimeline(entry);
            }));
        } catch (error) {
            console.error('Failed to save timeline entries:', error);
            throw error;
        }
    }
}

export default new TimelineBuilder(); 