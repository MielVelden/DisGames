import { 
    InteractionEvent,
    SelectMenuInteractionEvent
} from '../../src/interfaces/application/Event';
import { User } from '../../src/interfaces/domain/User';
import { ServersModel } from '../../src/interfaces/database/TableInterfaces';
import { Command } from '../../src/interfaces/application/Command';
import { Component } from '../../src/interfaces/application/Message';
import { TestInputSimulator } from './TestInputSimulator';
import { TimelineEntriesSaveModel } from '../../src/interfaces/database/TableInterfaces';
import { GameSettingsSchema, GameSettingsValues } from '../../src/interfaces/domain/GameSettings';
import { Games_Settings } from '../../src/interfaces/domain/GameSettings';
import { LanguageEnum } from '../../src/interfaces/enums/database/LanguageEnum';
import { BaseSelectMenu } from '../../src/interfaces/application/Message';
import Logger from '../../src/utils/application/Logger';
import { MockEventWithCommand } from '../interfaces/MockEventInterface';
import { TestChannel } from '../interfaces/ChannelTestInterface';
import { TestMessage } from '../interfaces/MessageTestInterface';
import { TestServer } from '../interfaces/ServerTestInterface';
import { TestUser } from '../interfaces/UserTestInterface';
import { CommandEnum } from '../../src/interfaces/enums/commands/CommandEnum';
import { MultiLingualString } from '../../src/utils/i18n/MultiLingualString';
import { EventTypeEnum, UserRoleEnum } from '../../src/interfaces/enums';

export class MockDiscordEvent implements InteractionEvent {
    public readonly type: EventTypeEnum;
    public readonly customId: string;
    public readonly currentInteraction: any;
    public readonly user: User;
    public readonly server: ServersModel;
    public readonly messageId: string;
    public readonly channelId: string;
    public readonly guildId: string;
    public components: Component[] = [];
    public timelineEntries: TimelineEntriesSaveModel[] = [];

    private inputSimulator: TestInputSimulator;
    private sentMessages: Component[][] = [];
    private editedContent: string[] = [];

    constructor(
        type: EventTypeEnum,
        customId: string,
        currentInteraction: any,
        user: User,
        server: ServersModel,
        channelId: string,
        guildId: string,
        messageId: string,
        inputSimulator?: TestInputSimulator
    ) {
        this.type = type;
        this.customId = customId;
        this.currentInteraction = currentInteraction;
        this.user = user;
        this.server = server;
        this.channelId = channelId;
        this.guildId = guildId;
        this.messageId = messageId;
        this.inputSimulator = inputSimulator || new TestInputSimulator();
    }

    public async addComponentAsync(component: Component): Promise<void> {
        this.components.push(component);
    }

    public async addComponentsAsync(components: Component[]): Promise<void> {
        this.components.push(...components);
    }

    public async clearComponentsAsync(): Promise<void> {
        this.components = [];
    }

    public async sendToChannelAsync(channelId: string, components: Component[]): Promise<void> {
        this.sentMessages.push([...components]);
        
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.inputSimulator.trackMessage(messageId, channelId, components, false);
        
        Logger.logTest(`Sent message to channel ${channelId} with ${components.length} components`);
    }

    public async editAsync(content?: string): Promise<void> {
        if (content)
            this.editedContent.push(content);
        
        this.inputSimulator.trackMessage(this.messageId, this.channelId, this.components, true);
        
        Logger.logTest(`Edited message: ${content || 'with components'}`);
    }

    public async editWithComponentAsync(component: Component): Promise<void> {
        this.components = [component];
        
        this.inputSimulator.trackMessage(this.messageId, this.channelId, [component], true);
        
        Logger.logTest(`Edited message with component`);
    }

    public async getUserInputBySelectMenuAsync(selectMenu: BaseSelectMenu): Promise<SelectMenuInteractionEvent | null> {
        const simulatedResponse = this.inputSimulator.getNextSelectMenuResponse();
        if (simulatedResponse) {
            return this.createSelectMenuEvent(simulatedResponse.value as string);
        }
        return null;
    }

    public async getUserInputByButtonsAsync(question: MultiLingualString, buttons: MultiLingualString[]): Promise<string | null> {
        const simulatedResponse = this.inputSimulator.getNextButtonResponse();
        return simulatedResponse?.value as string || null;
    }

    public async getConfirmationFromUser(container: Component): Promise<InteractionEvent | null> {
        const confirmation = this.inputSimulator.getNextConfirmationResponse();
        return confirmation?.value as boolean ? this : null;
    }

    public async getSettingsContainer(settingsSchema: GameSettingsSchema, initialSettings?: GameSettingsValues): Promise<Games_Settings | null> {
        const settings = this.inputSimulator.getNextSettingsResponse();
        return settings?.value as Games_Settings || null;
    }

    public async getChannelNameAsync(channelId: string): Promise<string> {
        return `test-channel-${channelId}`;
    }

    public addTimelineEntry(entry: TimelineEntriesSaveModel): void {
        this.timelineEntries.push(entry);
    }

    public async commitTimelineAsync(): Promise<void> {
        Logger.logTest(`Committed ${this.timelineEntries.length} timeline entries`);
    }

    public async deleteAsync(): Promise<void> {
        this.inputSimulator.trackDeletedMessage(this.messageId);
        Logger.logTest(`Deleted message ${this.messageId}`);
    }

    public async sendAsync(): Promise<void> {
        Logger.logTest(`Sent message response`);
    }

    public async reactAsync(emoji: string): Promise<void> {
        this.inputSimulator.trackReaction(this.messageId, emoji, this.user.userId, true);
        
        Logger.logTest(`Reacted with emoji: ${emoji}`);
    }

    public async unreactAsync(emoji: string): Promise<void> {
        this.inputSimulator.trackReaction(this.messageId, emoji, this.user.userId, false);
        
        Logger.logTest(`Removed reaction emoji: ${emoji}`);
    }

    public async replyAsync(content?: MultiLingualString): Promise<void> {
        if(content)
            Logger.logTest(`Replied with: ${content?.getMessage()}`);
        else
            Logger.logTest(`Replied with no content`);
    }

    public messageDeleted: boolean = false;
    public content: string = '';

    private createSelectMenuEvent(selectedValue: string): SelectMenuInteractionEvent {
        const event = { ...this } as MockEventWithCommand;
        event.selected = selectedValue;
        event.deferReplyAsync = async () => {};
        event.sendAsync = async () => {};
        event.replyAsync = async () => {};
        return event as SelectMenuInteractionEvent;
    }

    public getSentMessages(): Component[][] {
        return this.sentMessages;
    }

    public getEditedContent(): string[] {
        return this.editedContent;
    }

    public getComponents(): Component[] {
        return this.components;
    }

    public setInputSimulator(simulator: TestInputSimulator): void {
        this.inputSimulator = simulator;
    }

    public getTrackedMessages(): any[] {
        return this.inputSimulator.getTrackedMessages();
    }

    public getTrackedReactions(): any[] {
        return this.inputSimulator.getTrackedReactions();
    }

    public getMessagesByChannel(channelId: string): any[] {
        return this.inputSimulator.getMessagesByChannel(channelId);
    }

    public getReactionsByMessage(messageId: string): any[] {
        return this.inputSimulator.getReactionsByMessage(messageId);
    }

    public getReactionsByEmoji(emoji: string): any[] {
        return this.inputSimulator.getReactionsByEmoji(emoji);
    }

    public clearTracker(): void {
        this.inputSimulator.clearTracker();
    }
}

export class TestDiscordEventBuilder {
    private inputSimulator: TestInputSimulator = new TestInputSimulator();
    private lastChannelId?: string;

    public withUser(user: Partial<TestUser>): TestDiscordEventBuilder {
        this.inputSimulator.setUser(user);
        return this;
    }   

    public withServer(server: Partial<TestServer>): TestDiscordEventBuilder {
        this.inputSimulator.setServer(server);
        return this;
    }

    public withChannel(channel: Partial<TestChannel>): TestDiscordEventBuilder {
        if (channel.id) this.lastChannelId = channel.id;
        this.inputSimulator.setChannel(channel);
        return this;
    }

    public withMessage(message: Partial<TestMessage>): TestDiscordEventBuilder {
        this.inputSimulator.setMessage(message);
        return this;
    }

    public withInputSimulator(simulator: TestInputSimulator): TestDiscordEventBuilder {
        const current = this.inputSimulator;
        this.inputSimulator = simulator;
        this.inputSimulator.setUser(current.getUser());
        this.inputSimulator.setServer(current.getServer());
        this.inputSimulator.setChannel(current.getChannel());
        this.inputSimulator.setMessage(current.getMessage());
        this.lastChannelId = this.inputSimulator.getChannel().id;
        return this;
    }

    private resolveChannelId(): string {
        const id = this.inputSimulator.getChannel().id;
        return (id && id !== '1') ? id : (this.lastChannelId || id);
    }

    public buildSlashCommandEvent(commandName: CommandEnum, options: Record<string, any> = {}): MockDiscordEvent {
        const mockCommand: Command = {
            name: commandName,
            description: new MultiLingualString({ 
                [LanguageEnum.EN]: `Test command ${commandName}`,
                [LanguageEnum.NL]: `Test commando ${commandName}`
            }),
            isSlashCommand: true,
            isMessageCommand: false,
            options: [],
            executeAsync: async () => {}
        };

        const user: User = {
            id: undefined,
            userId: this.inputSimulator.getUser().id,
            username: this.inputSimulator.getUser().username,
            displayName: this.inputSimulator.getUser().username,
            bot: this.inputSimulator.getUser().bot || false,
            hasPermissions: () => true,
            hasPermission: () => true,
            sendMessageAsync: async () => {},
            role: UserRoleEnum.USER
        };

        const server = new ServersModel({
            Id: parseInt(this.inputSimulator.getServer().id),
            Name: this.inputSimulator.getServer().name,
            ServerId: this.inputSimulator.getServer().id,
            LanguageEnum: this.inputSimulator.getServer().languageEnum,
            Points: this.inputSimulator.getServer().points || 0
        });

        const channelId = this.resolveChannelId();

        const mockInteraction = {
            commandName,
            options: new Map(Object.entries(options)),
            user: { id: this.inputSimulator.getUser().id },
            guild: { id: this.inputSimulator.getServer().id },
            channel: { id: channelId },
            id: this.inputSimulator.getMessage().id,
            reply: async () => {},
            editReply: async () => {},
            getOption: (name: string) => options[name]
        };

        this.lastChannelId = channelId;

        const event = new MockDiscordEvent(
            EventTypeEnum.SLASH_COMMAND,
            commandName,
            mockInteraction,
            user,
            server,
            channelId,
            this.inputSimulator.getServer().id,
            this.inputSimulator.getMessage().id,
            this.inputSimulator
        ) as MockEventWithCommand;

        event.command = mockCommand;
        event.getOption = (name: string) => options[name];

        return event as MockDiscordEvent;
    }

    public buildMessageEvent(content: string = this.inputSimulator.getMessage().content, userId?: string): MockDiscordEvent {
        const user: User = {
            id: undefined,
            userId: userId || this.inputSimulator.getUser().id,
            username: this.inputSimulator.getUser().username,
            displayName: this.inputSimulator.getUser().username,
            bot: this.inputSimulator.getUser().bot || false,
            hasPermissions: () => true,
            hasPermission: () => true,
            sendMessageAsync: async () => {},
            role: UserRoleEnum.USER
        };

        const server = new ServersModel({
            Id: parseInt(this.inputSimulator.getServer().id),
            Name: this.inputSimulator.getServer().name,
            ServerId: this.inputSimulator.getServer().id,
            LanguageEnum: this.inputSimulator.getServer().languageEnum,
            Points: this.inputSimulator.getServer().points || 0
        });

        const channelId = this.resolveChannelId();

        const mockMessage = {
            content,
            author: { 
                id: userId || this.inputSimulator.getUser().id,
                bot: this.inputSimulator.getUser().bot || false
            },
            channel: { id: channelId },
            guild: { id: this.inputSimulator.getServer().id },
            id: this.inputSimulator.getMessage().id,
            reply: async () => {},
            edit: async () => {},
            delete: async () => {}
        };

        const event = new MockDiscordEvent(
            EventTypeEnum.MESSAGE,
            content,
            mockMessage,
            user,
            server,
            channelId,
            this.inputSimulator.getServer().id,
            this.inputSimulator.getMessage().id,
            this.inputSimulator
        );

        event.content = content;

        return event;
    }

    public buildButtonEvent(customId: string): MockDiscordEvent {
        const user: User = {
            id: undefined,
            userId: this.inputSimulator.getUser().id,
            username: this.inputSimulator.getUser().username,
            displayName: this.inputSimulator.getUser().username,
            bot: this.inputSimulator.getUser().bot || false,
            hasPermissions: () => true,
            hasPermission: () => true,
            sendMessageAsync: async () => {},
            role: UserRoleEnum.USER
        };

        const server = new ServersModel({
            Id: parseInt(this.inputSimulator.getServer().id),
            Name: this.inputSimulator.getServer().name,
            ServerId: this.inputSimulator.getServer().id,
            LanguageEnum: this.inputSimulator.getServer().languageEnum,
            Points: this.inputSimulator.getServer().points || 0
        });

        const channelId = this.resolveChannelId();

        const mockInteraction = {
            customId,
            user: { id: this.inputSimulator.getUser().id },
            guild: { id: this.inputSimulator.getServer().id },
            channel: { id: channelId },
            id: this.inputSimulator.getMessage().id,
            reply: async () => {},
            update: async () => {}
        };

        return new MockDiscordEvent(
            EventTypeEnum.BUTTON,
            customId,
            mockInteraction,
            user,
            server,
            channelId,
            this.inputSimulator.getServer().id,
            this.inputSimulator.getMessage().id,
            this.inputSimulator
        );
    }

    public static create(): TestDiscordEventBuilder {
        return new TestDiscordEventBuilder();
    }
}

export default TestDiscordEventBuilder;