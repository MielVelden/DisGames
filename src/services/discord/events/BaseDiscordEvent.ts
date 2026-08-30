import { User } from "../../../interfaces/domain/User";
import { Component, BaseSelectMenu, SelectMenu, MessageHandle } from "../../../interfaces/application/Message";
import { ServersModel } from "../../../interfaces/database/TableInterfaces";
import { Interaction as DiscordInteraction, Message as DiscordMessage } from "discord.js";
import { MultiLingualString } from "../../../utils/i18n/MultiLingualString";
import { ModalDefinition, ModalField, ModalResult } from "../../../interfaces/application/Modal";
import { BaseInteractionEvent, InteractionEvent, SelectMenuInteractionEvent } from "../../../interfaces/application/Event";
import { EventTypeEnum, ExceptionEnum } from "../../../interfaces/enums";
import DiscordComponentMapper from "../mappers/DiscordComponentMapper";
import DiscordMessageHandler from "../handlers/DiscordMessageHandler";
import { GameSettingsValues, GameSettingsSchema, Games_Settings } from "../../../interfaces/domain/GameSettings";
import { ButtonStyle } from "../../../interfaces/application/Message";
import GameService from "../../domain/GameService";
import { buildGameSettingsModal, mapGameSettingsModalResult } from "../../../builders/modals/GameSettingsModal";
import { createGenericButton } from "../../../builders/buttons/GenericButton";
import ComponentService from "../../application/ComponentService";
import { i18n } from "../../../utils/i18n/i18n";
import { TimelineEntriesSaveModel } from "../../../interfaces/database";
import TimelineBuilder from "../../domain/TimelineBuilder";
import { DifficultyEnum } from "../../../interfaces/enums/games/DifficultyEnum";
import { ErrorHelper } from "../../../utils/application/Error";
import Logger from "../../../utils/application/Logger";

export abstract class BaseDiscordEvent<TInteraction extends DiscordInteraction | DiscordMessage> implements BaseInteractionEvent {
    public readonly type: EventTypeEnum;
    public readonly customId: string;
    protected readonly interaction: TInteraction;
    public readonly user: User;
    public readonly server: ServersModel;
    public readonly messageId: string;
    public readonly channelId: string;
    public readonly guildId: string;

    public components: Component[] = [];
    public timelineEntries: TimelineEntriesSaveModel[] = [];
    private postSendTasks: Array<() => Promise<void>> = [];

    constructor(
        type: EventTypeEnum,
        customId: string,
        interaction: TInteraction,
        user: User,
        server: ServersModel,
        channelId: string,
        guildId: string,
        messageId: string
    ) {
        this.type = type;
        this.customId = customId;
        this.interaction = interaction;
        this.user = user;
        this.server = server;
        this.channelId = channelId;
        this.guildId = guildId;
        this.messageId = messageId;
    }

    public async addComponentAsync(component: Component): Promise<void> {
        await DiscordComponentMapper.addComponentAsync(this as unknown as InteractionEvent, component);
    }

    public async addComponentsAsync(components: Component[], addInFront: boolean = false): Promise<void> {
        await DiscordComponentMapper.addComponentsAsync(this as unknown as InteractionEvent, components, addInFront);
    }

    public async clearComponentsAsync(): Promise<void> {
        await DiscordComponentMapper.clearComponentsAsync(this as unknown as InteractionEvent);
    }

    public async sendToChannelAsync(channelId: string, components: Component[]): Promise<MessageHandle | null> {
        const handle = await DiscordMessageHandler.sendToChannelAsync(this as unknown as InteractionEvent, channelId, components);
        this.flushPostSend();
        return handle;
    }

    public async editChannelMessageAsync(channelId: string, messageId: string, components: Component[]): Promise<boolean> {
        const result = await DiscordMessageHandler.editChannelMessageAsync(this as unknown as InteractionEvent, channelId, messageId, components);
        this.flushPostSend();
        return result;
    }

    public async deleteChannelMessageAsync(channelId: string, messageId: string): Promise<boolean> {
        return await DiscordMessageHandler.deleteChannelMessageAsync(this as unknown as InteractionEvent, channelId, messageId);
    }

    public async editAsync(content?: string): Promise<void> {
        await DiscordMessageHandler.editAsync(this as unknown as InteractionEvent, content);
        this.flushPostSend();
    }

    public async editWithComponentsAsync(components: Component[]): Promise<void> {
        await DiscordMessageHandler.editWithComponentsAsync(this as unknown as InteractionEvent, components);
    }

    public async getUserInputBySelectMenuAsync(selectMenu: BaseSelectMenu): Promise<SelectMenuInteractionEvent | null> {
        const result = await DiscordMessageHandler.getUserInputBySelectMenuAsync(this as unknown as InteractionEvent, selectMenu as SelectMenu);
        return result as SelectMenuInteractionEvent | null;
    }

    public async getUserInputByButtonsAsync(question: MultiLingualString, buttons: MultiLingualString[]): Promise<string | null> {
        return await DiscordMessageHandler.getUserInputByButtonsAsync(this as unknown as InteractionEvent, question, buttons);
    }

    public async getConfirmationFromUserAsync(container: Component[]): Promise<InteractionEvent | null> {
        return await DiscordMessageHandler.getConfirmationFromUser(this as unknown as InteractionEvent, container);
    }

    public async askUserAsync<const TFields extends Record<string, ModalField>>(modal: ModalDefinition<TFields>): Promise<ModalResult<TFields> | null> {
        return await DiscordMessageHandler.askUserAsync(this as unknown as InteractionEvent, modal);
    }

    public async getGameSettingsViaModalAsync(settingsSchema: GameSettingsSchema, initialSettings?: GameSettingsValues, components?: Component[]): Promise<{ settings: Games_Settings; event: InteractionEvent } | null> {
        const mapSettings = (settings: GameSettingsValues): Games_Settings => {
            return {
                difficulty: settings.difficulty as DifficultyEnum,
                resetOnFail: settings.resetOnFail as boolean,
                datasheets: settings.datasheets as number[]
            };
        };

        const currentSettings = initialSettings || GameService.getDefaultSettings(settingsSchema);

        return new Promise(async (resolve) => {
            const showConfigureStepAsync = async (targetEvent: InteractionEvent, extraComponents: Component[]): Promise<void> => {
                const configureButton = createGenericButton(
                    new MultiLingualString(i18n.commands.games.settings.configureButton),
                    ButtonStyle.SECONDARY,
                    "⚙️",
                    this.user.userId,
                    false,
                    async (btnEvent: InteractionEvent) => {
                        const modal = buildGameSettingsModal(settingsSchema, currentSettings, new MultiLingualString(i18n.commands.games.settings.title), this.server);
                        const submission = await DiscordMessageHandler.showModalAndAwaitSubmissionAsync(btnEvent, modal);

                        if (!submission) {
                            resolve(null);
                            return;
                        }

                        const { values, premiumRejected } = mapGameSettingsModalResult(settingsSchema, submission.result as unknown as Record<string, unknown>, this.server);

                        if (premiumRejected) {
                            const errorMessage = ComponentService.createContent(new MultiLingualString(i18n.commands.games.settings.premiumRequired));
                            await showConfigureStepAsync(submission.event, [...(components || []), errorMessage]);
                            return;
                        }

                        const updatedSettings = { ...currentSettings, ...values };
                        resolve({ settings: mapSettings(updatedSettings), event: submission.event });
                    }
                );

                await targetEvent.editWithComponentsAsync([...extraComponents, configureButton]);
            };

            await showConfigureStepAsync(this as unknown as InteractionEvent, components || []);
        });
    }

    public async getChannelNameAsync(channelId: string): Promise<string> {
        const guild = this.currentInteraction.guild;
        if (!guild)
            ErrorHelper.throw(ExceptionEnum.DISCORD_GUILD_NOT_FOUND);

        const channel = await guild.channels.fetch(channelId);
        if (!channel)
            ErrorHelper.throw(ExceptionEnum.DISCORD_CHANNEL_NOT_FOUND);

        return channel.name;
    }

    public scheduleAction(task: () => Promise<void>): void {
        this.postSendTasks.push(task);
    }

    protected flushPostSend(): void {
        const tasks = this.postSendTasks.splice(0);
        for (const task of tasks)
            task().catch(err => Logger.logError('Post-send task failed', err as Error));
    }

    public addTimelineEntry(entry: TimelineEntriesSaveModel): void {
        this.timelineEntries.push(entry);
    }

    public async commitTimelineAsync(): Promise<void> {
        await TimelineBuilder.commitTimelineEntriesAsync(this.timelineEntries);
        this.timelineEntries = [];
    }
    public get currentInteraction(): TInteraction {
        return this.interaction;
    }
}