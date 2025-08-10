import { Games_Settings } from '../../src/interfaces/domain/GameSettings';
import { Component } from '../../src/interfaces/application/Message';
import { ExceptionEnum } from '../../src/interfaces/enums';

export enum TestInputSimulatorType {
    SELECT_MENU = 'selectMenu',
    BUTTON = 'button',
    CONFIRMATION = 'confirmation',
    SETTINGS = 'settings',
    INPUT = 'input',
    CORRECT_INPUT = 'correctInput',
    WRONG_INPUT = "WRONG_INPUT"
}

export interface InputQueue {
    selectMenuResponses: TestInputSimulatorOptions[];
    buttonResponses: TestInputSimulatorOptions[];
    confirmationResponses: TestInputSimulatorOptions[];
    settingsResponses: TestInputSimulatorOptions[];
    inputResponses: TestInputSimulatorOptions[];
}

export interface TestInputSimulatorOptions {
    type: TestInputSimulatorType;
    value: string | Games_Settings | boolean;
    userId: string;
    expectedException?: ExceptionEnum;
}

export interface TrackedMessage {
    id: string;
    channelId: string;
    content: Component[];
    timestamp: number;
    isEdit: boolean;
    isDeleted: boolean;
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