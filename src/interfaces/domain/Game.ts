import { Component } from "../application/Message";
import { User } from "./User";
import { EventTypeEnum } from "../application/Event";
import { MultiLingualString } from "../../utils/i18n/MultiLangualString";
import { LanguageEnum } from "../enums";
import { GameSettingsSchema } from "./GameSettings";
import { GameDataModel, GamesModel, ServersModel } from "../database/TableInterfaces";
import GameDataRepository from "../../repositories/GameDataRepository";

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
    settings?: GameSettingsSchema;
}

export interface GameFunctions {
    // Validate the answer
    validateAnswer(event: GameEvent): boolean;
    
    // Get the next answer/prompt
    getUpdatedGameAnswerAsync?(event: GameEvent): Promise<void>;
    onIncorrectAnswerAsync?(event: GameEvent): Promise<void>;

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

export class GameEvent implements GameFunctions {
    public eventType: EventTypeEnum;
    public messageId: string;
    public gameId: number;
    public gameConfig: GameConfig;

    public user: User;
    public server: ServersModel;

    public requireUpdateModel: boolean;
  
    private _gameData: GamesModel;
    private _nextAnswer?: GameDataModel[];
    private _userInput?: string | number | boolean;
    private _actions: GameAction[];

    public validateAnswer: (event: GameEvent) => boolean;
    public getUpdatedGameAnswerAsync?: (event: GameEvent) => Promise<void>;
    public onIncorrectAnswerAsync?: (event: GameEvent) => Promise<void>;
    public getStartComponentsAsync?: (gameData: GameDataModel[], server: ServersModel) => Promise<Component[]>;
    public prepareDataAsync?: (gameData: GameDataModel[], languageEnum: LanguageEnum) => Promise<string>;

    public deleteMessage: () => Promise<void>;

    public constructor(params: {
        eventType: EventTypeEnum;
        messageId: string;
        gameId: number;
        gameConfig: GameConfig;
        user: User;
        server: ServersModel;
        userInput: string | number | boolean;
        gameData: GamesModel;
        validateAnswer: (event: GameEvent) => boolean;
        getNextAnswerAsync?: (event: GameEvent) => Promise<void>;
        onIncorrectAnswerAsync?: (event: GameEvent) => Promise<void>;
        deleteMessage: () => Promise<void>;
    }) {
        this.eventType = params.eventType;
        this.messageId = params.messageId;
        this.gameId = params.gameId;
        this.gameConfig = params.gameConfig;
        this.user = params.user;
        this.server = params.server;
        this._userInput = params.userInput;
        this._gameData = params.gameData;
        this.validateAnswer = params.validateAnswer;
        this.getUpdatedGameAnswerAsync = params.getNextAnswerAsync;
        this.onIncorrectAnswerAsync = params.onIncorrectAnswerAsync;
        this.deleteMessage = params.deleteMessage;

        this.requireUpdateModel = false;
        this._actions = [];
    }

    public get userInput(): string | number | boolean | undefined {
        return this._userInput;
    }

    public set userInput(value: string | number | boolean | undefined) {
        this._userInput = value;
        this.requireUpdateModel = true;
    }

    public get actions(): GameAction[] {
        return this._actions;
    }

    public set actions(actions: GameAction[]) {
        this._actions = actions;
    }

    public addAction(action: GameAction): void {
        this._actions.push(action);
    }

    public removeAction(action: GameAction): void {
        this._actions = this._actions.filter(a => a.enum !== action.enum);
    }

    public async getNextAnswerAsync(): Promise<GameDataModel[]> {
        if(!this._nextAnswer)
            this._nextAnswer = await GameDataRepository.getGameDataByGamesIdAsync(this._gameData.Id);

        if(!this._nextAnswer)
            throw new Error('No next answer found');

        return this._nextAnswer;
    }

    public setNextAnswer(nextAnswer: GameDataModel[] | undefined) {
        this._nextAnswer = nextAnswer;
    }

    public getGameData(): GamesModel {
        return this._gameData;
    }

    public setGameData(gameData: GamesModel) {
        this._gameData = gameData;
    }

    public getGameDataAnswer(): string {
        return this._gameData.Answer;
    }

    public setGameDataAnswer(answer: string) {
        this._gameData.Answer = answer;
        this.requireUpdateModel = true;
    }
}