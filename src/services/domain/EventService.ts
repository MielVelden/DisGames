import { InteractionEvent, LiveEventData, WebSocketEvent } from "../../interfaces/application";
import { EventsModel, EventsSaveModel } from "../../interfaces/database/TableInterfaces";
import { isMessageEventType } from "../../interfaces/enums/application/EventTypeEnum";
import { LanguageEnum } from "../../interfaces/enums";
import EventRepository from "../../repositories/EventRepository";
import GameRepository from "../../repositories/GameRepository";
import { BaseDomainService } from "./BaseDomainService";
import GameService from "./GameService";
import { registerService } from "../../utils/container/Container";
import { wsService } from "../../server";
import Logger from "../../utils/application/Logger";

export class EventService extends BaseDomainService<EventsModel, EventsSaveModel, typeof EventRepository> {
    protected readonly repository = EventRepository;

    public async initAsync(): Promise<void> {}

    public getAllAsync(): Promise<EventsModel[]> {
        return this.repository.getAllAsync();
    }

    protected async performSaveAsync(savable: EventsSaveModel, event: InteractionEvent): Promise<EventsModel> {
        const entity = await this.repository.saveAsync(savable);

        // Fire-and-forget: the live feed must never slow down or break event handling
        this.broadcastLiveEventAsync(entity, savable, event)
            .catch(error => Logger.logError("Failed to broadcast live event", error as Error));

        return entity;
    }

    private async broadcastLiveEventAsync(entity: EventsModel, savable: EventsSaveModel, event: InteractionEvent): Promise<void> {
        const payload = savable.PayloadJSON;
        const data: LiveEventData = {
            id: entity.Id,
            type: event.type,
            createdAt: new Date(entity.CreatedAt ?? Date.now()).toISOString(),
            user: {
                displayName: event.user.displayName,
                username: event.user.username,
                bot: event.user.bot,
            },
            server: { name: event.server.Name },
            channelId: event.channelId,
            commandName: payload?.commandName,
            content: payload?.content,
        };

        if (isMessageEventType(event.type)) {
            const game = await GameRepository.getByChannelIdAsync(event.channelId);
            if (game) {
                const gameModule = await GameService.getGameByTypeAsync(game.GameTypeEnum);
                data.game = {
                    id: game.GameTypeEnum,
                    name: gameModule?.config.name.getMessage(LanguageEnum.EN) ?? String(game.GameTypeEnum),
                    emoji: gameModule?.config.emoji ?? "🎮",
                };
            }
        }

        await wsService.broadcastMessageAsync(WebSocketEvent.LIVE_EVENT, data);
    }

    public purgeAsync(id: number): Promise<void> {
        return this.repository.purgeAsync(id);
    }

    public async getTotalAsync() {
        return this.repository.getTotalAsync();
    }


}

const eventService = new EventService();
registerService(eventService);
export default eventService;
