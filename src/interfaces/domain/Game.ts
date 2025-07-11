import { Component } from "../application/Message";
import { User } from "./User";
import { GameDataModel, GamesModel, ServersModel } from "../database/TableInterfaces";
import { EventTypeEnum } from "../application/Event";
import { MultiLingualString } from "../../utils/i18n/MultiLangualString";

// Game configuration interface
export interface GameConfig {
    id: number;
    emoji: string;
    name: MultiLingualString;
    description: MultiLingualString;
    points: number;
    isCalculated: boolean;
    expectedType: "string" | "number" | "boolean";
    firstAnswer: string;
    addCorrectReaction: boolean;
    hasImages?: boolean;
    options: {
        [key in GameOptionEnum]: boolean;
    };
}

export interface GameFunctions {
    // Validate the answer
    validateAnswer(event: GameEvent): boolean;
    
    // Get the next answer/prompt
    getNextAnswerAsync(event: GameEvent): Promise<void>;
}

export interface GameModule {
    config: GameConfig;
    functions: GameFunctions;
}

// Name enums where the number is the order of the run order
// The lower the number, the earlier it runs
// Naming convention: if the value is true, the game option will run
export enum GameOptionEnum {
    IS_INACTIVE = 1,
    DISABLE_MESSAGE_CHANGE = 2,
    SAME_USER_DISABLED = 5,
    REMOVE_ON_WRONG_ANSWER = 10,
    ALLOW_SKIPPING = 15,
}

export interface GameAction {
    enum: GameActionEnum;
    priority: GameActionPriorityEnum;
    component: Component | Component[] | string;
}

export enum GameActionEnum {
    COMPONENT = "component",
    REACTION = "reaction",
}

export enum GameActionPriorityEnum {
    LOW = 0,
    MEDIUM = 1,
    HIGH = 2,
    CRITICAL = 3,
}

export interface GameEvent extends GameFunctions {
    eventType: EventTypeEnum;
    messageId: string;
    gameId: number;
    gameConfig: GameConfig;

    user: User;
    server: ServersModel;
    
    answer?: string | number | boolean;
    nextAnswer?: GameDataModel;
    gameData: GamesModel;
    
    actions: GameAction[];
    addAction(action: GameAction): void;
    removeAction(action: GameAction): void;

    deleteMessage: () => Promise<void>;
}