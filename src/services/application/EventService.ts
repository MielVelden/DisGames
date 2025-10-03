import { ButtonHandler, SelectMenuHandler, InteractionEvent, SelectMenuInteractionEvent } from '../../interfaces/application/Event';
import { calculateDuration, durationToMilliseconds } from '../../utils/Duration';
import { DurationEnum } from '../../interfaces/application/Duration';
import Logger from '../../utils/Logger';
import { EventTypeEnum } from '../../interfaces/enums';

const DEFAULT_TIMEOUT = calculateDuration(10, DurationEnum.SECOND);

export class EventService {
  private static buttonHandlers: Map<string, ButtonHandler> = new Map();
  private static selectMenuHandlers: Map<string, SelectMenuHandler> = new Map();
  private static timeouts: Map<string, NodeJS.Timeout> = new Map();
  private static internallyDeletedMessages: Set<string> = new Set();

  // #region Message Delete Tracking
  public static markMessageAsInternallyDeleted(messageId: string): void {
    EventService.internallyDeletedMessages.add(messageId);

    // Auto cleanup after 30 seconds to prevent memory leaks
    setTimeout(() => {
      EventService.internallyDeletedMessages.delete(messageId);
    }, 30000);
  }

  public static isMessageInternallyDeleted(messageId: string): boolean {
    return EventService.internallyDeletedMessages.has(messageId);
  }

  public static removeInternallyDeletedMessage(messageId: string): void {
    EventService.internallyDeletedMessages.delete(messageId);
  }
  // #endregion

  public static registerButtonHandler(handler: ButtonHandler): void {
    EventService.buttonHandlers.set(handler.id, handler);
    EventService.setupTimeout(handler);
  }

  public static registerSelectMenuHandler(handler: SelectMenuHandler): void {
    EventService.selectMenuHandlers.set(handler.id, handler);
    EventService.setupTimeout(handler);
  }

  public static registerHandler(type: EventTypeEnum, handler: ButtonHandler | SelectMenuHandler): void {
    switch (type) {
      case EventTypeEnum.BUTTON:
        EventService.registerButtonHandler(handler);
        break;
      case EventTypeEnum.SELECT_MENU:
        EventService.registerSelectMenuHandler(handler);
        break;
      case EventTypeEnum.MESSAGE:
      case EventTypeEnum.MESSAGE_UPDATE:
      case EventTypeEnum.MESSAGE_DELETE:
      case EventTypeEnum.SLASH_COMMAND:
      case EventTypeEnum.MODAL_SUBMIT:
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
      if (handler.userId && handler.userId !== interaction.user.userId) {
        return;
      }

      EventService.removeHandler(handler.id);
      await handler.handle(interaction);
    } else {
      Logger.logDebug(`No handler found for button: ${interaction.customId}`);
    }
  }

  public static async handleSelectMenuInteraction(interaction: SelectMenuInteractionEvent): Promise<void> {
    const handler = EventService.selectMenuHandlers.get(interaction.customId);
    Logger.logDebug(`Handling select menu interaction: ${interaction.customId}`);
    if (handler) {
      if (handler.userId && handler.userId !== interaction.user.userId) {
        return;
      }
      await interaction.deferReplyAsync();

      EventService.removeHandler(handler.id);
      await handler.handle(interaction);
    } else {
      Logger.logDebug(`No handler found for select menu: ${interaction.customId}`);
    }
  }

  public static handleEventAsync(event: InteractionEvent) {
    switch (event.type) {
      case EventTypeEnum.BUTTON:
        return this.handleButtonInteraction(event);
      case EventTypeEnum.SELECT_MENU:
        return this.handleSelectMenuInteraction(event as SelectMenuInteractionEvent);
      case EventTypeEnum.MESSAGE:
      case EventTypeEnum.MESSAGE_UPDATE:
      case EventTypeEnum.MESSAGE_DELETE:
      case EventTypeEnum.SLASH_COMMAND:
      case EventTypeEnum.MODAL_SUBMIT:
        throw new Error("Event type not implemented");
      default:
        const exhaustiveCheck: never = event.type;
        throw new Error(`Unhandled event type: ${exhaustiveCheck}`);
    }
  }
} 