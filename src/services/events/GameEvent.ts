import { Component } from "../../interfaces/application/Message";
import { User } from "../../interfaces/domain/User";
import { EventTypeEnum, ExceptionEnum } from "../../interfaces/enums";
import { LanguageEnum } from "../../interfaces/enums";
import { GameDataModel, GamesModel, ServersModel } from "../../interfaces/database/TableInterfaces";
import GameDataRepository from "../../repositories/GameDataRepository";
import { GameConfig, IGameEvent } from "../../interfaces/domain/Game";
import { GameAction } from "../../interfaces/domain/Game";
import { ErrorHelper } from "../../utils/application/Error";

export class GameEvent implements IGameEvent {
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

    public validateAnswer: (event: IGameEvent) => boolean;
    public getUpdatedGameAnswerAsync?: (event: IGameEvent) => Promise<void>;
    public onIncorrectAnswerAsync?: (event: IGameEvent) => Promise<void>;
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
        validateAnswer: (event: IGameEvent) => boolean;
        getNextAnswerAsync?: (event: IGameEvent) => Promise<void>;
        onIncorrectAnswerAsync?: (event: IGameEvent) => Promise<void>;
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
            ErrorHelper.throw(ExceptionEnum.NO_NEXT_ANSWER_FOUND);

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
        console.log("getGameDataAnswer", this._gameData.Answer);
        return this._gameData.Answer;
    }

    public setGameDataAnswer(answer: string) {
        console.log("setGameDataAnswer", answer);
        this._gameData.Answer = answer;
        this.requireUpdateModel = true;
    }
}
