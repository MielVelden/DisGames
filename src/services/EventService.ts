import { ButtonHandler, SelectMenuHandler, InteractionEvent, EventType, SelectMenuInteractionEvent } from '../interfaces/application/Event';
import { calculateDuration, DurationEnum, durationToMilliseconds } from '../utils/Duration';

export const DEFAULT_TIMEOUT = calculateDuration(10, DurationEnum.SECOND);

export class EventService {
  private static buttonHandlers: Map<string, ButtonHandler> = new Map();
  private static selectMenuHandlers: Map<string, SelectMenuHandler> = new Map();
  private static timeouts: Map<string, NodeJS.Timeout> = new Map();

  public static registerButtonHandler(handler: ButtonHandler): void {
    EventService.buttonHandlers.set(handler.id, handler);
    EventService.setupTimeout(handler);
  }

  public static registerSelectMenuHandler(handler: SelectMenuHandler): void {
    EventService.selectMenuHandlers.set(handler.id, handler);
    EventService.setupTimeout(handler);
  }

  public static registerHandler(type: EventType, handler: ButtonHandler | SelectMenuHandler): void {
    switch (type) {
      case EventType.BUTTON:
        EventService.registerButtonHandler(handler);
        break;
      case EventType.SELECT_MENU:
        EventService.registerSelectMenuHandler(handler);
        break;
      case EventType.MESSAGE:
      case EventType.SLASH_COMMAND:
      case EventType.MODAL_SUBMIT:
        throw new Error("Event type not implemented");
      default:
          const exhaustiveCheck: never = type;
          throw new Error(`Unhandled event type: ${exhaustiveCheck}`);
    }
  }

  private static setupTimeout(handler: ButtonHandler | SelectMenuHandler): void {
    if (handler.onTimeout) {
      const timeoutId = setTimeout(async () => {
        EventService.removeHandler(handler.id);
        if (handler.onTimeout) {
          await handler.onTimeout();
        }
      }, durationToMilliseconds(handler.timeout ?? DEFAULT_TIMEOUT));
      
      EventService.timeouts.set(handler.id, timeoutId);
    }
  }

  private static removeHandler(handlerId: string): void {
    EventService.buttonHandlers.delete(handlerId);
    EventService.selectMenuHandlers.delete(handlerId);
    
    const timeoutId = EventService.timeouts.get(handlerId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      EventService.timeouts.delete(handlerId);
    }
  }

  public static async handleButtonInteraction(interaction: InteractionEvent): Promise<void> {
    const handler = EventService.buttonHandlers.get(interaction.customId);
    if (handler) {
      if (handler.userId && handler.userId !== interaction.user.id) {
        return;
      }
      
      EventService.removeHandler(handler.id);
      await handler.handle(interaction);
    } else {
      console.log(`No handler found for button: ${interaction.customId}`);
    }
  }

  public static async handleSelectMenuInteraction(interaction: SelectMenuInteractionEvent): Promise<void> {
    const handler = EventService.selectMenuHandlers.get(interaction.customId);
    console.log(`[INFO] Handling select menu interaction: ${interaction.customId}`);
    if (handler) {
      if (handler.userId && handler.userId !== interaction.user.id) {
        return;
      }
      await interaction.deferReplyAsync();
      
      EventService.removeHandler(handler.id);
      await handler.handle(interaction);
    } else {
      console.log(`No handler found for select menu: ${interaction.customId}`);
    }
  }

  public static handleEventAsync(event: InteractionEvent) {
    switch (event.type) {
      case EventType.BUTTON:
        return this.handleButtonInteraction(event);
      case EventType.SELECT_MENU:
        return this.handleSelectMenuInteraction(event as SelectMenuInteractionEvent);
      case EventType.MESSAGE:
      case EventType.SLASH_COMMAND:
      case EventType.MODAL_SUBMIT:
        throw new Error("Event type not implemented");
      default:
          const exhaustiveCheck: never = event.type;
          throw new Error(`Unhandled event type: ${exhaustiveCheck}`);
    }
  }
} 