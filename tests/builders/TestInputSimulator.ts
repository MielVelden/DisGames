import { MultiLingualString } from '../../src/utils/i18n/MultiLangualString';
import { Games_Settings } from '../../src/interfaces/domain/GameSettings';
import Logger from '../../src/utils/Logger';
import { InputQueue, TestInputSimulatorOptions, MessageAndReactionTracker, TrackedMessage, TrackedReaction } from '../interfaces/InputQueueInterface';
import { Component } from '../../src/interfaces/application/Message';

export class TestInputSimulator {
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
        Logger.logTest(`Simulated input response: ${response.value}`);
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
    public expectSelectMenu(value: string, userId: string): TestInputSimulator {
        return this.addSelectMenuResponse({ value, userId });
    }

    public expectButton(value: string, userId: string): TestInputSimulator {
        return this.addButtonResponse({ value, userId });
    }

    public expectConfirmation(value: boolean, userId: string): TestInputSimulator {
        return this.addConfirmationResponse({ value: value, userId });
    }

    public expectInput(value: string, userId: string): TestInputSimulator {
        return this.addInputResponse({ value, userId });
    }

    public expectSettings(settings: Games_Settings, userId: string): TestInputSimulator {
        return this.addSettingsResponse({ value: settings, userId });
    }

    // Message and Reaction tracking methods
    public trackMessage(id: string, channelId: string, content: Component[], isEdit: boolean = false): void {
        const trackedMessage: TrackedMessage = {
            id,
            channelId,
            content: [...content],
            timestamp: Date.now(),
            isEdit
        };
        this.tracker.messages.push(trackedMessage);
        Logger.logTest(`Tracked ${isEdit ? 'edited' : 'new'} message ${id} in channel ${channelId} with ${content.length} components`);
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
        Logger.logTest(`Tracked ${isAdd ? 'added' : 'removed'} reaction ${emoji} on message ${messageId} by user ${userId}`);
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

    public clearTracker(): void {
        this.tracker = {
            messages: [],
            reactions: []
        };
        Logger.logTest('Message and reaction tracker cleared');
    }
}

export default TestInputSimulator;