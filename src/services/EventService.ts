import { ButtonHandler, SelectMenuHandler, InteractionEvent } from '../interfaces/application/Event';

export class EventService {
  private static buttonHandlers: Map<string, ButtonHandler> = new Map();
  private static selectMenuHandlers: Map<string, SelectMenuHandler> = new Map();

  public static registerButtonHandler(handler: ButtonHandler): void {
    EventService.buttonHandlers.set(handler.id, handler);
  }

  public static registerSelectMenuHandler(handler: SelectMenuHandler): void {
    EventService.selectMenuHandlers.set(handler.id, handler);
  }

  public static async handleButtonInteraction(interaction: InteractionEvent): Promise<void> {
    const handler = EventService.buttonHandlers.get(interaction.customId);
    if (handler) {
      if (handler.userId && handler.userId !== interaction.user.id) {
        return;
      }
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
      await handler.handle(interaction);
    } else {
      console.log(`No handler found for select menu: ${interaction.customId}`);
    }
  }
} 