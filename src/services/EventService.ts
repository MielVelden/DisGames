import { ButtonHandler, SelectMenuHandler, InteractionEvent, SlashCommandInteractionEvent, EventType } from '../interfaces/application/Event';
import { calculateDuration, DurationEnum, durationToMilliseconds } from '../utils/Duration';

export const DEFAULT_TIMEOUT = calculateDuration(1, DurationEnum.MINUTE);

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

  public static async handleSelectMenuInteraction(interaction: InteractionEvent): Promise<void> {
    const handler = EventService.selectMenuHandlers.get(interaction.customId);
    if (handler) {
      if (handler.userId && handler.userId !== interaction.user.id) {
        return;
      }
      
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
        return this.handleSelectMenuInteraction(event);
      case EventType.SLASH_COMMAND:
        throw new Error("Slash command not implemented");
    }
  }
} 