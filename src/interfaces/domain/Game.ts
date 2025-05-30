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

export enum GameOptionEnum {
    IS_ACTIVE = "is_active",
    REACT = "react",
    SAME_USER_ALLOWED = "same_user_allowed",
    ALLOW_MESSAGE_CHANGE = "allow_message_change",
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
    gameId: number;
    gameConfig: GameConfig;

    user: User;
    server: ServersModel;
    
    answer?: string | number | boolean;
    gameData: GamesModel;
    
    actions: GameAction[];
    addAction(action: GameAction): void;
}