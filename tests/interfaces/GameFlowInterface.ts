import { GameTypeEnum } from '../../src/interfaces/enums/database/GameTypeEnum';
import { TestInputSimulator } from '../builders/TestInputSimulator';
import { Component } from '../../src/interfaces/application/Message';
import { GamesModel } from '../../src/interfaces/database/TableInterfaces';

export interface GameFlowTestConfig {
    gameType: GameTypeEnum;
    channelId: string;
    serverId: string;
    userId: string;
    expectedAnswers: string[];
    settings?: any;
    inputSimulator?: TestInputSimulator;
}

export interface GameFlowTestResult {
    success: boolean;
    game?: GamesModel;
    messages: Component[][];
    timeline: any[];
    errors: string[];
    finalAnswer?: string;
}