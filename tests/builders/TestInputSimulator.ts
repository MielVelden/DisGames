import Logger from '../../src/utils/Logger';
import { InputQueue, TestInputSimulatorOptions, MessageAndReactionTracker, TrackedMessage, TrackedReaction, TestInputSimulatorType } from '../interfaces/InputQueueInterface';
import { Component } from '../../src/interfaces/application/Message';
import { TestUser } from '../interfaces/UserTestInterface';
import { TestServer } from '../interfaces/ServerTestInterface';
import { TestChannel } from '../interfaces/ChannelTestInterface';
import { TestMessage } from '../interfaces/MessageTestInterface';

export class TestInputSimulator {

    private gameFirstAnswer: string = '';
    private queue: InputQueue = {
        selectMenuResponses: [],
        buttonResponses: [],
        confirmationResponses: [],
        settingsResponses: [],
        inputResponses: []
    };

    private currentIndex: Record<keyof InputQueue, number> = {
        selectMenuResponses: 0,
        buttonResponses: 0,
        confirmationResponses: 0,
        settingsResponses: 0,
        inputResponses: 0
    };

    private tracker: MessageAndReactionTracker = {
        messages: [],
        reactions: []
    };

    // State for building mock events
    private user: TestUser = { id: '1', username: 'TestUser', bot: false };
    private server: TestServer = { id: '1', name: 'TestServer', languageEnum: 0, points: 0 };
    private channel: TestChannel = { id: '1', name: 'TestChannel', type: 0 };
    private message: TestMessage = { id: '1', content: '', authorId: '1', channelId: '1', guildId: '1' };

    public setUser(user: Partial<TestUser>): void {
        this.user = {
            id: user.id || this.user.id,
            username: user.username || this.user.username,
            bot: user.bot ?? this.user.bot
        };
    }

    public getUser(): TestUser {
        return this.user;
    }

    public setServer(server: Partial<TestServer>): void {
        this.server = {
            id: server.id || this.server.id,
            name: server.name || this.server.name,
            languageEnum: server.languageEnum ?? this.server.languageEnum,
            points: server.points ?? this.server.points
        };
    }

    public getServer(): TestServer {
        return this.server;
    }

    public setChannel(channel: Partial<TestChannel>): void {
        this.channel = {
            id: channel.id || this.channel.id,
            name: channel.name || this.channel.name,
            type: channel.type ?? this.channel.type
        };
    }

    public getChannel(): TestChannel {
        return this.channel;
    }

    public setMessage(message: Partial<TestMessage>): void {
        this.message = {
            id: message.id || this.message.id,
            content: message.content || this.message.content || '',
            authorId: message.authorId || this.user.id,
            channelId: message.channelId || this.channel.id,
            guildId: message.guildId || this.server.id,
            timestamp: message.timestamp || this.message.timestamp
        };
    }

    public getMessage(): TestMessage {
        return this.message;
    }

    public addSelectMenuResponse(options: TestInputSimulatorOptions): TestInputSimulator {
        this.queue.selectMenuResponses.push(options);
        return this;
    }

    public addButtonResponse(options: TestInputSimulatorOptions): TestInputSimulator {
        this.queue.buttonResponses.push(options);
        return this;
    }

    public addConfirmationResponse(options: TestInputSimulatorOptions): TestInputSimulator {
        this.queue.confirmationResponses.push(options);
        return this;
    }

    public addSettingsResponse(options: TestInputSimulatorOptions): TestInputSimulator {
        this.queue.settingsResponses.push(options);
        return this;
    }

    public addInputResponse(options: TestInputSimulatorOptions): TestInputSimulator {
        this.queue.inputResponses.push(options);
        return this;
    }

    public getNextSelectMenuResponse(): TestInputSimulatorOptions | null {
        const responses = this.queue.selectMenuResponses;
        const index = this.currentIndex.selectMenuResponses;

        if (index >= responses.length) {
            Logger.logTest('No more select menu responses available');
            return null;
        }

        const response = responses[index];
        this.currentIndex.selectMenuResponses++;
        Logger.logTest(`Simulated select menu response: ${response}`);
        return response;
    }

    public getNextButtonResponse(): TestInputSimulatorOptions | null {
        const responses = this.queue.buttonResponses;
        const index = this.currentIndex.buttonResponses;

        if (index >= responses.length) {
            Logger.logTest('No more button responses available');
            return null;
        }

        const response = responses[index];
        this.currentIndex.buttonResponses++;
        Logger.logTest(`Simulated button response: ${response}`);
        return response;
    }

    public getNextConfirmationResponse(): TestInputSimulatorOptions | null {
        const responses = this.queue.confirmationResponses;
        const index = this.currentIndex.confirmationResponses;

        if (index >= responses.length) {
            Logger.logTest('No more confirmation responses available');
            return null;
        }

        const response = responses[index];
        this.currentIndex.confirmationResponses++;
        Logger.logTest(`Simulated confirmation response: ${response}`);
        return response;
    }

    public getNextSettingsResponse(): TestInputSimulatorOptions | null {
        const responses = this.queue.settingsResponses;
        const index = this.currentIndex.settingsResponses;

        if (index >= responses.length) {
            Logger.logTest('No more settings responses available');
            return null;
        }

        const response = responses[index];
        this.currentIndex.settingsResponses++;
        Logger.logTest(`Simulated settings response: ${JSON.stringify(response)}`);
        return response;
    }

    public getNextInputResponse(): TestInputSimulatorOptions | null {
        const responses = this.queue.inputResponses;
        const index = this.currentIndex.inputResponses;

        if (index >= responses.length) {
            Logger.logTest('No more input responses available');
            return null;
        }

        const response = responses[index];
        this.currentIndex.inputResponses++;
        Logger.logTest(`Simulated input response: ${response.value} (${response.type})`);
        return response;
    }

    public reset(): void {
        this.currentIndex = {
            selectMenuResponses: 0,
            buttonResponses: 0,
            confirmationResponses: 0,
            settingsResponses: 0,
            inputResponses: 0
        };
        Logger.logTest('Input simulator reset');
    }

    public clear(): void {
        this.queue = {
            selectMenuResponses: [],
            buttonResponses: [],
            confirmationResponses: [],
            settingsResponses: [],
            inputResponses: []
        };
        this.tracker = {
            messages: [],
            reactions: []
        };
        this.reset();
        Logger.logTest('Input simulator cleared');
    }

    public hasMoreResponses(): boolean {
        return Object.keys(this.queue).some((key) => {
            const queueKey = key as keyof InputQueue;
            return this.currentIndex[queueKey] < this.queue[queueKey].length;
        });
    }

    public getRemainingResponseCounts(): Record<keyof InputQueue, number> {
        const remaining: any = {};
        Object.keys(this.queue).forEach((key) => {
            const queueKey = key as keyof InputQueue;
            remaining[queueKey] = this.queue[queueKey].length - this.currentIndex[queueKey];
        });
        return remaining;
    }

    public static create(): TestInputSimulator {
        return new TestInputSimulator();
    }

    // Convenience methods for chaining
    public setGameFirstAnswer(answer: string): TestInputSimulator {
        this.gameFirstAnswer = answer;
        return this;
    }

    public addSelectMenu(selectMenu: Omit<TestInputSimulatorOptions, 'type'>): TestInputSimulator {
        return this.addSelectMenuResponse({ ...selectMenu, type: TestInputSimulatorType.SELECT_MENU });
    }

    public addButton(button: Omit<TestInputSimulatorOptions, 'type'>): TestInputSimulator {
        return this.addButtonResponse({ ...button, type: TestInputSimulatorType.BUTTON });
    }

    public addConfirmation(confirmation: Omit<TestInputSimulatorOptions, 'type'>): TestInputSimulator {
        return this.addConfirmationResponse({ ...confirmation, type: TestInputSimulatorType.CONFIRMATION });
    }

    public addInput(input: Omit<TestInputSimulatorOptions, 'type'>): TestInputSimulator {
        return this.addInputResponse({ ...input, type: TestInputSimulatorType.INPUT });
    }

    public addCorrectInput(input: Omit<TestInputSimulatorOptions, 'type'>): TestInputSimulator {
        return this.addInputResponse({ ...input, type: TestInputSimulatorType.CORRECT_INPUT });
    }

    public addWrongInput(input: Omit<TestInputSimulatorOptions, 'type'>): TestInputSimulator {
        return this.addInputResponse({ ...input, type: TestInputSimulatorType.WRONG_INPUT });
    }

    public addSettings(settings: Omit<TestInputSimulatorOptions, 'type'>): TestInputSimulator {
        return this.addSettingsResponse({ ...settings, type: TestInputSimulatorType.SETTINGS });
    }

    // Message and Reaction tracking methods
    public trackMessage(id: string, channelId: string, content: Component[], isEdit: boolean = false): void {
        const trackedMessage: TrackedMessage = {
            id,
            channelId,
            content: [...content],
            timestamp: Date.now(),
            isEdit,
            isDeleted: false
        };
        this.tracker.messages.push(trackedMessage);
        Logger.logDebug(`Tracked ${isEdit ? 'edited' : 'new'} message ${id} in channel ${channelId} with ${content.length} components`);
    }

    public trackReaction(messageId: string, emoji: string, userId: string, isAdd: boolean = true): void {
        const trackedReaction: TrackedReaction = {
            messageId,
            emoji,
            userId,
            timestamp: Date.now(),
            isAdd
        };
        this.tracker.reactions.push(trackedReaction);
        Logger.logDebug(`Tracked ${isAdd ? 'added' : 'removed'} reaction ${emoji} on message ${messageId} by user ${userId}`);
    }

    public trackDeletedMessage(messageId: string): void {
        this.tracker.messages.push({
            id: messageId,
            channelId: this.channel.id,
            content: [],
            timestamp: Date.now(),
            isEdit: false,
            isDeleted: true
        });
    }

    public getTrackedMessages(): TrackedMessage[] {
        return [...this.tracker.messages];
    }

    public getTrackedReactions(): TrackedReaction[] {
        return [...this.tracker.reactions];
    }

    public getTracker(): MessageAndReactionTracker {
        return {
            messages: [...this.tracker.messages],
            reactions: [...this.tracker.reactions]
        };
    }

    public getMessagesByChannel(channelId: string): TrackedMessage[] {
        return this.tracker.messages.filter(msg => msg.channelId === channelId);
    }

    public getReactionsByMessage(messageId: string): TrackedReaction[] {
        return this.tracker.reactions.filter(reaction => reaction.messageId === messageId);
    }

    public getReactionsByEmoji(emoji: string): TrackedReaction[] {
        return this.tracker.reactions.filter(reaction => reaction.emoji === emoji);
    }

    public getGameFirstAnswer(): string {
        return this.gameFirstAnswer;
    }

    public clearTracker(): void {
        this.tracker = {
            messages: [],
            reactions: []
        };
        Logger.logTest('Message and reaction tracker cleared');
    }
}

export default TestInputSimulator;