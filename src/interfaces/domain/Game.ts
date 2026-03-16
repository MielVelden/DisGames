import { Component } from "../application/Message";
import { User } from "./User";
import { EventTypeEnum, GameTypeEnum } from "../enums";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { LanguageEnum } from "../enums";
import { GameSettingsSchema } from "./GameSettings";
import { GameDataModel, GamesModel, ServersModel } from "../database/TableInterfaces";

export interface IGameEvent {
    eventType: EventTypeEnum;
    messageId: string;
    gameId: number;
    gameConfig: GameConfig;
    user: User;
    server: ServersModel;
    requireUpdateModel: boolean;
    userInput: string | number | boolean | undefined;
    actions: GameAction[];
    validateAnswer: (event: IGameEvent) => boolean;
    getUpdatedGameAnswerAsync?: (event: IGameEvent) => Promise<void>;
    onIncorrectAnswerAsync?: (event: IGameEvent) => Promise<void>;
    getStartComponentsAsync?: (gameData: GameDataModel[], server: ServersModel) => Promise<Component[]>;
    prepareDataAsync?: (gameData: GameDataModel[], languageEnum: LanguageEnum) => Promise<string>;
    deleteMessage: () => Promise<void>;
    getNextAnswerAsync(): Promise<GameDataModel[]>;
    setNextAnswer(nextAnswer: GameDataModel[] | undefined): void;
    getGameData(): GamesModel;
    setGameData(gameData: GamesModel): void;
    getGameDataAnswer(): string;
    setGameDataAnswer(answer: string): void;
    addAction(action: GameAction): void;
    removeAction(action: GameAction): void;
}

// Game configuration interface
export interface GameConfig {
    id: GameTypeEnum;
    emoji: string;
    name: MultiLingualString;
    description: MultiLingualString;
    points: number;
    isCalculated: boolean;
    expectedType: "string" | "number" | "boolean";
    firstAnswer: string;
    addCorrectReaction: boolean;
    hasImages?: boolean;
    hasDataSheets?: boolean;
    options: {
        [key in GameOptionEnum]: boolean;
    };
    settings?: GameSettingsSchema;
}

export interface GameFunctions {
    // Validate the answer
    validateAnswer(event: IGameEvent): boolean;
    
    // Get the next answer/prompt
    getUpdatedGameAnswerAsync?(event: IGameEvent): Promise<void>;
    onIncorrectAnswerAsync?(event: IGameEvent): Promise<void>;

    // Get the components for the start message
    getStartComponentsAsync?(gameData: GameDataModel[], server: ServersModel): Promise<Component[]>;

    // Prepare the data for the game
    prepareDataAsync?(gameData: GameDataModel[], languageEnum: LanguageEnum): Promise<string>;
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