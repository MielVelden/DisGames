import { User } from "../../../interfaces/domain/User";
import { Component, BaseSelectMenu, SelectMenu } from "../../../interfaces/application/Message";
import { ServersModel } from "../../../interfaces/database/TableInterfaces";
import { Interaction as DiscordInteraction, Message as DiscordMessage } from "discord.js";
import { MultiLingualString } from "../../../utils/i18n/MultiLingualString";
import { ModalDefinition, ModalField, ModalResult } from "../../../interfaces/application/Modal";
import { BaseInteractionEvent, InteractionEvent, SelectMenuInteractionEvent } from "../../../interfaces/application/Event";
import { AppEntitlement } from "../../../interfaces/application/Entitlement";
import { EventTypeEnum, ExceptionEnum } from "../../../interfaces/enums";
import DiscordComponentMapper from "../mappers/DiscordComponentMapper";
import DiscordMessageHandler from "../handlers/DiscordMessageHandler";
import { GameSettingsValues, GameSettingsSchema, Games_Settings, GameSettingOption } from "../../../interfaces/domain/GameSettings";
import { GameSettingsContainerConfig, GameSettingsHandler } from "../../../interfaces/application/GameSetting";
import { StringSelect, SelectOption, ComponentType } from "../../../interfaces/application/Message";
import GameService from "../../domain/GameService";
import { createGameSettingsContainer } from "../../../builders/containers/GameSettingsContainer";
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
    public readonly entitlements: readonly AppEntitlement[];

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
        messageId: string,
        entitlements: readonly AppEntitlement[] = []
    ) {
        this.type = type;
        this.customId = customId;
        this.interaction = interaction;
        this.user = user;
        this.server = server;
        this.channelId = channelId;
        this.guildId = guildId;
        this.messageId = messageId;
        this.entitlements = entitlements;
    }

    public hasEntitlementForSku(skuId: string): boolean {
        return this.entitlements.some(e => e.skuId === skuId);
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

    public async sendToChannelAsync(channelId: string, components: Component[]): Promise<void> {
        await DiscordMessageHandler.sendToChannelAsync(this as unknown as InteractionEvent, channelId, components);
        this.flushPostSend();
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

    private updateSetting<K extends keyof GameSettingsValues>(
        settings: GameSettingsValues,
        key: K,
        value: GameSettingsValues[K]
    ): void {
        settings[key] = value;
    }

    public async getSettingsContainer(settingsSchema: GameSettingsSchema, initialSettings?: GameSettingsValues): Promise<Games_Settings | null> {
        const mapSettings = (settings: GameSettingsValues): Games_Settings => {
            return {
                difficulty: settings.difficulty as DifficultyEnum,
                resetOnFail: settings.resetOnFail as boolean,
                datasheets: settings.datasheets as number[]
            };
        };
        
        return new Promise(async (resolve) => {
            let currentSettings = initialSettings || GameService.getDefaultSettings(settingsSchema);
            let isResolved = false;
            
            const config: GameSettingsContainerConfig = {
                settingsSchema,
                currentSettings,
                languageEnum: this.server.LanguageEnum,
                userId: this.user.userId,
                onSettingChange: (btnEvent, key, value) => {
                    if (!isResolved) {
                        this.updateSetting(currentSettings, key, value);
                        updateContainer(btnEvent);
                    }
                },
                onAccept: () => {
                    if (!isResolved) {
                        isResolved = true;
                        resolve(mapSettings(currentSettings));
                    }
                },
                onCancel: () => {
                    if (!isResolved) {
                        isResolved = true;
                        resolve(null);
                    }
                }
            };

            const handlers: GameSettingsHandler = {
                onEnumClick: async (btnEvent, key, enumSetting, currentValue) => {
                    if (isResolved) 
                        return;
                    
                    const selectMenu: StringSelect = {
                        type: ComponentType.STRING_SELECT,
                        custom_id: crypto.randomUUID(),
                        title: enumSetting.label,
                        placeholder: enumSetting.label,
                        description: enumSetting.label,
                        options: enumSetting.options.map((option: GameSettingOption): SelectOption => ({
                            label: option.label,
                            value: option.value.toString(),
                            description: option.description,
                            default: option.value === currentValue
                        }))
                    };
                    
                    const selectResult = await btnEvent.getUserInputBySelectMenuAsync(selectMenu);
                    if (selectResult && !isResolved) {
                        const newValue = enumSetting.options.find((opt: GameSettingOption) => opt.value.toString() === selectResult.selected)?.value;
                        if (newValue !== undefined) {
                            this.updateSetting(currentSettings, key, newValue);
                            config.currentSettings = currentSettings;
                            await updateContainer(selectResult);
                        }
                    }
                },
                onListClick: async (btnEvent, key, listSetting, currentValues) => {
                    if (isResolved)
                        return;

                    const selectMenu: StringSelect = {
                        type: ComponentType.STRING_SELECT,
                        custom_id: crypto.randomUUID(),
                        title: listSetting.label,
                        placeholder: listSetting.label,
                        description: listSetting.label,
                        min_values: 0,
                        max_values: listSetting.options.length,
                        options: listSetting.options.map((option: GameSettingOption): SelectOption => ({
                            label: option.label,
                            value: option.value.toString(),
                            description: option.description,
                            default: currentValues.includes(typeof option.value === "number" ? option.value : Number(option.value))
                        }))
                    };

                    const selectResult = await btnEvent.getUserInputBySelectMenuAsync(selectMenu);
                    if (selectResult && !isResolved) {
                        const newValues = listSetting.options
                            .map(opt => opt.value)
                            .filter(value => selectResult.selectedValues.includes(value.toString()))
                            .map(value => typeof value === "number" ? value : Number(value));

                        this.updateSetting(currentSettings, key, newValues);
                        config.currentSettings = currentSettings;
                        await updateContainer(selectResult);
                    }
                }
            };
            
            const updateContainer = async (btnEvent?: InteractionEvent): Promise<void> => {
                const components = createGameSettingsContainer(config, handlers);

                if (btnEvent) {
                    await btnEvent.editWithComponentsAsync(components);
                } else {
                    await this.editWithComponentsAsync(components);
                }
            };
            
            await updateContainer();
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