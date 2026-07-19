import { ButtonHandler, SelectMenuHandler, ModalHandler, InteractionEvent, SelectMenuInteractionEvent, ModalSubmitInteractionEvent } from '../../interfaces/application/Event';
import { calculateDuration, durationToMilliseconds } from '../../utils/helpers/Duration';
import { DurationEnum } from '../../interfaces/application/Duration';
import Logger from '../../utils/application/Logger';
import { EventTypeEnum, ExceptionEnum } from '../../interfaces/enums';
import { assertNever, ErrorHelper } from '../../utils/application/Error';
import { withEventContextAsync } from '../../middleware/EventContext';
import { MultiLingualString } from '../../utils/i18n/MultiLingualString';
import { i18n } from '../../utils/i18n/i18n';
import { parsePersistentCustomId } from '../../builders/buttons/PersistentButton';
import { getPersistentButton } from '../../utils/collectors/PersistentButtonCollector';

const DEFAULT_TIMEOUT = calculateDuration(1, DurationEnum.MINUTE);

export class InteractionService {
  private static buttonHandlers: Map<string, ButtonHandler> = new Map();
  private static selectMenuHandlers: Map<string, SelectMenuHandler> = new Map();
  private static modalHandlers: Map<string, ModalHandler> = new Map();
  private static timeouts: Map<string, NodeJS.Timeout> = new Map();
  private static internallyDeletedMessages: Set<string> = new Set();

  // #region Message Delete Tracking
  public static markMessageAsInternallyDeleted(messageId: string): void {
    InteractionService.internallyDeletedMessages.add(messageId);

    // Auto cleanup after 30 seconds to prevent memory leaks
    setTimeout(() => {
      InteractionService.internallyDeletedMessages.delete(messageId);
    }, 30000);
  }

  public static isMessageInternallyDeleted(messageId: string): boolean {
    return InteractionService.internallyDeletedMessages.has(messageId);
  }

  public static removeInternallyDeletedMessage(messageId: string): void {
    InteractionService.internallyDeletedMessages.delete(messageId);
  }
  // #endregion

  public static registerButtonHandler(handler: ButtonHandler): void {
    InteractionService.buttonHandlers.set(handler.id, handler);
    InteractionService.setupTimeout(handler);
  }

  public static registerSelectMenuHandler(handler: SelectMenuHandler): void {
    InteractionService.selectMenuHandlers.set(handler.id, handler);
    InteractionService.setupTimeout(handler);
  }

  public static registerModalHandler(handler: ModalHandler): void {
    InteractionService.modalHandlers.set(handler.id, handler);
    InteractionService.setupTimeout(handler);
  }

  public static registerHandler(type: EventTypeEnum, handler: ButtonHandler | SelectMenuHandler | ModalHandler): void {
    switch (type) {
      case EventTypeEnum.BUTTON:
        InteractionService.registerButtonHandler(handler);
        break;
      case EventTypeEnum.SELECT_MENU:
        InteractionService.registerSelectMenuHandler(handler);
        break;
      case EventTypeEnum.MODAL_SUBMIT:
        InteractionService.registerModalHandler(handler);
        break;
      case EventTypeEnum.MESSAGE:
      case EventTypeEnum.MESSAGE_UPDATE:
      case EventTypeEnum.MESSAGE_DELETE:
      case EventTypeEnum.SLASH_COMMAND:
        ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);
      default:
        assertNever(type, EventTypeEnum)
    }
  }

  private static setupTimeout(handler: ButtonHandler | SelectMenuHandler | ModalHandler): void {
    if (handler.onTimeout) {
      const timeoutId = setTimeout(async () => {
        InteractionService.removeHandler(handler.id);
        if (handler.onTimeout) {
          await handler.onTimeout();
        }
      }, durationToMilliseconds(handler.timeout ?? DEFAULT_TIMEOUT));

      InteractionService.timeouts.set(handler.id, timeoutId);
    }
  }

  private static removeHandler(handlerId: string): void {
    InteractionService.buttonHandlers.delete(handlerId);
    InteractionService.selectMenuHandlers.delete(handlerId);
    InteractionService.modalHandlers.delete(handlerId);

    const timeoutId = InteractionService.timeouts.get(handlerId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      InteractionService.timeouts.delete(handlerId);
    }
  }

  public static async handleButtonInteraction(interaction: InteractionEvent): Promise<void> {
    const persistent = parsePersistentCustomId(interaction.customId);
    if (persistent) {
      const button = getPersistentButton(persistent.id);
      if (button)
        await button.handleAsync(interaction);
      else
        Logger.logDebug(`No persistent handler found for button: ${persistent.id}`);
      return;
    }

    const handler = InteractionService.buttonHandlers.get(interaction.customId);
    if (handler) {
      if (handler.userId && handler.userId !== interaction.user.userId)
        return await interaction.replyAsync(new MultiLingualString(i18n.labels.common.notYourEvent), true);

      InteractionService.removeHandler(handler.id);
      await handler.handle(interaction);
    } else {
      Logger.logDebug(`No handler found for button: ${interaction.customId}`);
    }
  }

  public static async handleSelectMenuInteraction(interaction: SelectMenuInteractionEvent): Promise<void> {
    const handler = InteractionService.selectMenuHandlers.get(interaction.customId);
    Logger.logDebug(`Handling select menu interaction: ${interaction.customId}`);
    if (handler) {
      if (handler.userId && handler.userId !== interaction.user.userId)
        return await interaction.replyAsync(new MultiLingualString(i18n.labels.common.notYourEvent), true);

      await interaction.deferReplyAsync();

      InteractionService.removeHandler(handler.id);
      await handler.handle(interaction);
    } else
      Logger.logDebug(`No handler found for select menu: ${interaction.customId}`);
  }

  public static async handleModalSubmitInteraction(interaction: ModalSubmitInteractionEvent): Promise<void> {
    const handler = InteractionService.modalHandlers.get(interaction.customId);
    Logger.logDebug(`Handling modal submit interaction: ${interaction.customId}`);
    if (handler) {
      if (handler.userId && handler.userId !== interaction.user.userId)
        return await interaction.replyAsync(new MultiLingualString(i18n.labels.common.notYourEvent), true);

      await interaction.deferReplyAsync();

      InteractionService.removeHandler(handler.id);
      await handler.handle(interaction);
    } else
      Logger.logDebug(`No handler found for modal submit: ${interaction.customId}`);
  }

  public static handleEventAsync(event: InteractionEvent) {
    return withEventContextAsync(event, async () => {
      const type = event.type;
      switch (type) {
        case EventTypeEnum.BUTTON:
          return this.handleButtonInteraction(event);
        case EventTypeEnum.SELECT_MENU:
          return this.handleSelectMenuInteraction(event as SelectMenuInteractionEvent);
        case EventTypeEnum.MODAL_SUBMIT:
          return this.handleModalSubmitInteraction(event as ModalSubmitInteractionEvent);
        case EventTypeEnum.MESSAGE:
        case EventTypeEnum.MESSAGE_UPDATE:
        case EventTypeEnum.MESSAGE_DELETE:
        case EventTypeEnum.SLASH_COMMAND:
          ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);
        default:
          assertNever(type, EventTypeEnum)
      }
    });
  }
} 