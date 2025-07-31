import { User } from "../../../interfaces/domain/User";
import { Component, BaseSelectMenu } from "../../../interfaces/application/Message";
import { ServersModel } from "../../../interfaces/database/TableInterfaces";
import { Interaction as DiscordInteraction, Message as DiscordMessage } from "discord.js";
import { MultiLingualString } from "../../../utils/i18n/MultiLangualString";
import { EventTypeEnum, InteractionEvent, SelectMenuInteractionEvent } from "../../../interfaces/application/Event";
import DiscordComponentMapper from "../mappers/DiscordComponentMapper";
import DiscordMessageHandler from "../handlers/DiscordMessageHandler";
import { GameSettingsSchema, GameSettingsValues } from "../../../interfaces/domain/GameSettings";
import { GameSettingsUtils } from "../../../utils/GameSettingsUtils";
import { GameSettingsContainer } from "../../../utils/GameSettingsContainer";
import { StringSelect, SelectOption, ComponentType } from "../../../interfaces/application/Message";

export abstract class BaseDiscordEvent implements InteractionEvent {
    public readonly type: EventTypeEnum;
    public readonly customId: string;
    public readonly currentInteraction: DiscordInteraction | DiscordMessage;
    public readonly user: User;
    public readonly server: ServersModel;
    public readonly messageId: string;
    public readonly channelId: string;
    public readonly guildId: string;

    public components: Component[] = [];

    constructor(
        type: EventTypeEnum,
        customId: string,
        interaction: DiscordInteraction | DiscordMessage,
        user: User,
        server: ServersModel,
        channelId: string,
        guildId: string,
        messageId: string
    ) {
        this.type = type;
        this.customId = customId;
        this.currentInteraction = interaction;
        this.user = user;
        this.server = server;
        this.channelId = channelId;
        this.guildId = guildId;
        this.messageId = messageId;
    }

    public async addComponentAsync(component: Component): Promise<void> {
        await DiscordComponentMapper.addComponentAsync(this, component);
    }

    public async addComponentsAsync(components: Component[]): Promise<void> {
        await DiscordComponentMapper.addComponentsAsync(this, components);
    }

    public async clearComponentsAsync(): Promise<void> {
        await DiscordComponentMapper.clearComponentsAsync(this);
    }

    public async sendToChannelAsync(channelId: string, components: Component[]): Promise<void> {
        await DiscordMessageHandler.sendToChannelAsync(this, channelId, components);
    }

    public async editAsync(content?: string): Promise<void> {
        await DiscordMessageHandler.editAsync(this, content);
    }

    public async editWithComponentAsync(component: Component): Promise<void> {
        await DiscordMessageHandler.editWithComponentAsync(this, component);
    }

    public async getUserInputBySelectMenuAsync(selectMenu: BaseSelectMenu): Promise<SelectMenuInteractionEvent | null> {
        const result = await DiscordMessageHandler.getUserInputBySelectMenuAsync(this, selectMenu as any);
        return result as SelectMenuInteractionEvent | null;
    }

    public async getUserInputByButtonsAsync(question: MultiLingualString, buttons: MultiLingualString[]): Promise<string | null> {
        return await DiscordMessageHandler.getUserInputByButtonsAsync(this, question, buttons);
    }

    public async getConfirmationFromUser(container: Component): Promise<InteractionEvent | null> {
        return await DiscordMessageHandler.getConfirmationFromUser(this, container);
    }

    public async getSettingsContainer(settingsSchema: GameSettingsSchema, initialSettings?: GameSettingsValues): Promise<GameSettingsValues | null> {
        return new Promise(async (resolve) => {
            // Initialize current settings with defaults
            let currentSettings = initialSettings || GameSettingsUtils.getDefaultValues(settingsSchema);
            let currentEvent: InteractionEvent = this;
            let isResolved = false; // Prevent multiple resolves
            
            // Define handlers outside of updateContainer to maintain proper scope
            const onBooleanClick = async (btnEvent: InteractionEvent, key: string, currentValue: boolean) => {
                if (isResolved) return; // Don't process if already resolved
                currentSettings[key] = !currentValue;
                currentEvent = btnEvent; // Update current event context
                await updateContainer(btnEvent);
            };

            const onEnumClick = async (btnEvent: InteractionEvent, key: string, enumSetting: any, currentValue: any) => {
                if (isResolved) return; // Don't process if already resolved
                // Create proper select menu with correct SelectOption structure
                const selectMenu: StringSelect = {
                    type: ComponentType.STRING_SELECT,
                    custom_id: crypto.randomUUID(),
                    placeholder: enumSetting.label,
                    question: enumSetting.label,
                    options: enumSetting.options.map((option: any): SelectOption => ({
                        label: option.label,
                        value: option.value.toString(),
                        description: option.description,
                        default: option.value === currentValue
                    }))
                };
                
                const selectResult = await btnEvent.getUserInputBySelectMenuAsync(selectMenu);
                if (selectResult && !isResolved) {
                    // Update the setting value
                    const newValue = enumSetting.options.find((opt: any) => opt.value.toString() === selectResult.selected)?.value;
                    if (newValue !== undefined) {
                        currentSettings[key] = newValue;
                        currentEvent = selectResult; // Update current event context
                        await updateContainer(selectResult);
                    }
                }
            };

            const onAcceptClick = async (btnEvent: InteractionEvent) => {
                if (!isResolved) {
                    isResolved = true;
                    resolve(currentSettings);
                }
            };

            const onCancelClick = async (btnEvent: InteractionEvent) => {
                if (!isResolved) {
                    isResolved = true;
                    resolve(null);
                }
            };
            
            const updateContainer = async (btnEvent?: InteractionEvent) => {
                // Use button event if available, otherwise use original event
                const eventToUse = btnEvent || currentEvent;
                
                const container = GameSettingsContainer.createInteractiveSettingsContainer(
                    settingsSchema,
                    currentSettings,
                    this.server.LanguageEnum,
                    // Boolean toggle callback - not used anymore, kept for compatibility
                    (key: string, currentValue: boolean) => {
                        // This is not called anymore
                    },
                    // Enum select callback - not used anymore, kept for compatibility
                    async (key: string, enumSetting: any, currentValue: any) => {
                        // This is not called anymore
                    },
                    // Accept callback - not used anymore, kept for compatibility
                    () => {
                        // This is not called anymore
                    },
                    // Cancel callback - not used anymore, kept for compatibility  
                    () => {
                        // This is not called anymore
                    },
                    this.user.id,
                    // Pass the actual handler functions
                    {
                        onBooleanClick,
                        onEnumClick,
                        onAcceptClick,
                        onCancelClick
                    }
                );
                
                await eventToUse.editWithComponentAsync(container);
            };
            
            // Show initial container
            await updateContainer();
        });
    }

    public async getChannelNameAsync(channelId: string): Promise<string> {
        const guild = this.currentInteraction.guild;
        if (!guild)
            throw new Error("Guild not found");

        const channel = await guild.channels.fetch(channelId);
        return channel?.name || channelId;
    }
} 