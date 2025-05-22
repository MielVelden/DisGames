import { Component } from "../application/Message";
import { User } from "./User";
import { Server } from "./Server";
import { GameData } from "./GameData";

export enum GameType {
    COUNTING = 1,
    WORD_SNAKE = 2,
    ANAGRAM = 3,
    NUMBER_GUESS = 4,
    TRIVIA_QUIZ = 5,
    GUESS_THE_PRICE = 6,
    MATH_QUIZ = 7,
    GUESS_THE_FLAG = 8,
}

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
    SEND_MESSAGE = "send_message",
    REPLY_MESSAGE = "reply_message",
    REACTION = "reaction",
}

export enum GameActionPriorityEnum {
    LOW = 0,
    MEDIUM = 1,
    HIGH = 2,
    CRITICAL = 3,
}

export interface GameEvent {
    gameId: number;
    gameConfig: GameConfig;

    user: User;
    server: Server;
    
    answer?: string | number | boolean;
    gameData: GameData;
    
    actions: GameAction[];
    addAction(action: GameAction): void;
}