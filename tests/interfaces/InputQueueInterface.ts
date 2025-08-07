import { Games_Settings } from '../../src/interfaces/domain/GameSettings';
import { Component } from '../../src/interfaces/application/Message';

export interface InputQueue {
    selectMenuResponses: TestInputSimulatorOptions[];
    buttonResponses: TestInputSimulatorOptions[];
    confirmationResponses: TestInputSimulatorOptions[];
    settingsResponses: TestInputSimulatorOptions[];
    inputResponses: TestInputSimulatorOptions[];
}

export interface TestInputSimulatorOptions {
    value: string | Games_Settings | boolean;
    userId: string;
}

export interface TrackedMessage {
    id: string;
    channelId: string;
    content: Component[];
    timestamp: number;
    isEdit: boolean;
}

export interface TrackedReaction {
    messageId: string;
    emoji: string;
    userId: string;
    timestamp: number;
    isAdd: boolean;
}

export interface MessageAndReactionTracker {
    messages: TrackedMessage[];
    reactions: TrackedReaction[];
}