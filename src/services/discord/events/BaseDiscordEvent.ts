import { User } from "../../../interfaces/domain/User";
import { Component, BaseSelectMenu } from "../../../interfaces/application/Message";
import { ServersModel } from "../../../interfaces/database/TableInterfaces";
import { Interaction as DiscordInteraction, Message as DiscordMessage } from "discord.js";
import { MultiLingualString } from "../../../utils/i18n/MultiLingualString";
import { InteractionEvent, SelectMenuInteractionEvent } from "../../../interfaces/application/Event";
import { EventTypeEnum, ExceptionEnum } from "../../../interfaces/enums";
import DiscordComponentMapper from "../mappers/DiscordComponentMapper";
import DiscordMessageHandler from "../handlers/DiscordMessageHandler";
import { GameSettingsValues, GameSettingsSchema, Games_Settings } from "../../../interfaces/domain/GameSettings";
import { GameSettingsContainerConfig, GameSettingsHandler } from "../../../interfaces/application/GameSetting";
import { StringSelect, SelectOption, ComponentType } from "../../../interfaces/application/Message";
import GameService from "../../domain/GameService";
import { GameSettingsContainer } from "../../../builders/containers/GameSettingsContainer";
import { TimelineEntriesSaveModel } from "../../../interfaces/database";
import TimelineBuilder from "../../domain/TimelineBuilder";
import { DifficultyEnum } from "../../../interfaces/enums/games/DifficultyEnum";
import { ErrorHelper } from "../../../utils/application/Error";

export abstract class BaseDiscordEvent<TInteraction extends DiscordInteraction | DiscordMessage> implements InteractionEvent {
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

    public async getSettingsContainer(settingsSchema: GameSettingsSchema, initialSettings?: GameSettingsValues): Promise<Games_Settings | null> {
        const mapSettings = (settings: GameSettingsValues): Games_Settings => {
            return {
                difficulty: settings.difficulty as DifficultyEnum,
                resetOnFail: settings.resetOnFail as boolean
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
                        (currentSettings as any)[key] = value;
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
                        const newValue = enumSetting.options.find((opt: any) => opt.value.toString() === selectResult.selected)?.value;
                        if (newValue !== undefined) {
                            (currentSettings as any)[key] = newValue;
                            config.currentSettings = currentSettings;
                            await updateContainer(selectResult);
                        }
                    }
                }
            };
            
            const updateContainer = async (btnEvent?: InteractionEvent) => {
                const container = GameSettingsContainer.createInteractiveContainer(config, handlers);
                
                if (btnEvent) {
                    await btnEvent.editWithComponentAsync(container);
                } else {
                    await this.editWithComponentAsync(container);
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