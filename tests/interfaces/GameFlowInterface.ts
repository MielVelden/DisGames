import { GameTypeEnum } from '../../src/interfaces/enums/database/GameTypeEnum';
import { TestInputSimulator } from '../builders/TestInputSimulator';
import { Component } from '../../src/interfaces/application/Message';
import { GamesModel } from '../../src/interfaces/database/TableInterfaces';
import { ComponentError } from '../../src/utils/application/Error';
import { TrackedMessage, TrackedReaction } from './InputQueueInterface';

export interface GameFlowTestConfig {
    gameType: GameTypeEnum;
    channelId: string;
    serverId: string;
    userId: string;
    settings?: any;
    inputSimulator: TestInputSimulator;
}

export interface GameFlowTestResult {
    success: boolean;
    game?: GamesModel;
    messages: Component[][];
    timeline: any[];
    errors: ComponentError[];
    finalAnswer?: string;
    trackedMessages?: TrackedMessage[];
    trackedReactions?: TrackedReaction[];
}