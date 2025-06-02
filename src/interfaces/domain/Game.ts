import { Component } from "../application/Message";
import { User } from "./User";
import { GameDataModel, GamesModel, ServersModel } from "../database/TableInterfaces";

// Game configuration interface
export interface GameConfig {
    id: number;
    name: string;
    description: string;
    points: number;
    expectedType: "string" | "number" | "boolean";
    firstAnswer: string;
    options: {
        [key in GameOptionEnum]: boolean;
    };
}

export interface GameFunctions {
    // Validate the answer
    validateAnswer(event: GameEvent): boolean;
    
    // Process the answer
    processAnswer(event: GameEvent): void;
    
    // Get the next answer/prompt
    getNextAnswer(event: GameEvent): string | number | boolean;
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
    REMOVE_ON_WRONG_ANSWER = 5,
    SAME_USER_DISABLED = 10,
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

export enum GameEventTypeEnum {
    MESSAGE_CREATE = "message_create",
    MESSAGE_UPDATE = "message_update",
}

export interface GameEvent extends GameFunctions {
    eventType: GameEventTypeEnum;
    messageId: string;
    gameId: number;
    gameConfig: GameConfig;

    user: User;
    server: ServersModel;
    
    answer?: string | number | boolean;
    gameData: GamesModel;
    
    actions: GameAction[];
    addAction(action: GameAction): void;

    deleteMessage: () => Promise<void>;
}