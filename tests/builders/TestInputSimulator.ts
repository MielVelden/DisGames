import { MultiLingualString } from '../../src/utils/i18n/MultiLangualString';
import { Games_Settings } from '../../src/interfaces/domain/GameSettings';
import Logger from '../../src/utils/Logger';
import { InputQueue } from '../interfaces/InputQueueInterface';

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

    public addSelectMenuResponse(value: string): TestInputSimulator {
        this.queue.selectMenuResponses.push(value);
        return this;
    }

    public addButtonResponse(value: string): TestInputSimulator {
        this.queue.buttonResponses.push(value);
        return this;
    }

    public addConfirmationResponse(value: boolean): TestInputSimulator {
        this.queue.confirmationResponses.push(value);
        return this;
    }

    public addSettingsResponse(settings: Games_Settings): TestInputSimulator {
        this.queue.settingsResponses.push(settings);
        return this;
    }

    public addInputResponse(value: string): TestInputSimulator {
        this.queue.inputResponses.push(value);
        return this;
    }

    public getNextSelectMenuResponse(): string | null {
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

    public getNextButtonResponse(): string | null {
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

    public getNextConfirmationResponse(): boolean | null {
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

    public getNextSettingsResponse(): Games_Settings | null {
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

    public getNextInputResponse(): string | null {
        const responses = this.queue.inputResponses;
        const index = this.currentIndex.inputResponses;
        
        if (index >= responses.length) {
            Logger.logTest('No more input responses available');
            return null;
        }

        const response = responses[index];
        this.currentIndex.inputResponses++;
        Logger.logTest(`Simulated input response: ${response}`);
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
    public expectSelectMenu(value: string): TestInputSimulator {
        return this.addSelectMenuResponse(value);
    }

    public expectButton(value: string): TestInputSimulator {
        return this.addButtonResponse(value);
    }

    public expectConfirmation(value: boolean): TestInputSimulator {
        return this.addConfirmationResponse(value);
    }

    public expectInput(value: string): TestInputSimulator {
        return this.addInputResponse(value);
    }

    public expectSettings(settings: Games_Settings): TestInputSimulator {
        return this.addSettingsResponse(settings);
    }
}

export default TestInputSimulator;