import { MessageInteractionEvent } from "../interfaces/application/Event";
import { GamesModel } from "../interfaces/database/TableInterfaces";
import { GameAction, GameActionEnum, GameEvent, GameModule } from "../interfaces/domain/Game";
import GameRepository from "../repositories/GameRepository";
import * as fs from "fs";
import * as path from "path";
import { GameTypeEnum } from "../interfaces/enums";
import { Component, ComponentType, TextDisplay } from "../interfaces/application/Message";

class GameService {

    private games: GameModule[] = [];

    constructor() {
        this.loadGames();
    }

    private loadGames(): void {
        const gamesPath = path.join(__dirname, 'games');

        try {
            const gameFiles = fs.readdirSync(gamesPath).filter(file =>
                file.endsWith('.ts') || file.endsWith('.js')
            );

            for (const file of gameFiles) {
                try {
                    const gamePath = path.join(gamesPath, file);
                    const gameModule = require(gamePath).default as GameModule;

                    if (gameModule && gameModule.config && gameModule.functions) {
                        this.games.push(gameModule);
                    }
                } catch (error) {
                    console.error(`Fout bij laden van game bestand ${file}:`, error);
                }
            }
        } catch (error) {
            console.error('Fout bij laden van games map:', error);
        }
    }

    public getGames(): GameModule[] {
        return this.games;
    }

    public getGameById(gameId: GameTypeEnum): GameModule | undefined {
        return this.games.find(game => game.config.id === gameId);
    }

    public async getGameByChannelIdAsync(channelId: string): Promise<GamesModel> {
        const game = await GameRepository.getByChannelIdAsync(channelId);
        return game;
    }

    public async handleGameAsync(event: MessageInteractionEvent): Promise<void> {
        const gameEvent = await this.createGameEvent(event);

        if (gameEvent.validateAnswer(gameEvent)) {
            gameEvent.processAnswer(gameEvent);
            gameEvent.getNextAnswer(gameEvent);

            // Save the model
            await GameRepository.save(gameEvent.gameData);

            gameEvent.actions.forEach(async (action) => {
                await this.handleGameAction(action, event);
            });

            await event.replyAsync();
        }
    }

    private async handleGameAction(action: GameAction, event: MessageInteractionEvent): Promise<void> {
        switch (action.enum) {
            case GameActionEnum.REACTION:
                await event.reactAsync(action.component as string);
                break;
            case GameActionEnum.COMPONENT:
                event.addComponentAsync(action.component as Component);
                break;
            default:
                const exhaustiveCheck: never = action.enum;
                throw new Error(`Unhandled game action type: ${exhaustiveCheck}`);
        }
    }

    private async createGameEvent(event: MessageInteractionEvent): Promise<GameEvent> {
        const game = await this.getGameByChannelIdAsync(event.channelId);

        // If no game is found, return
        if (!game)
            throw new Error(`Game not found for channel ${event.channelId}`);

        const gameModule = this.getGameById(game.GameTypeEnum);
        if (!gameModule)
            throw new Error(`Game module not found for game type ${game.GameTypeEnum}`);

        const gameEvent: GameEvent = {
            gameId: game.Id,
            gameConfig: gameModule.config,
            user: event.user,
            server: event.server,
            answer: event.content,
            addAction: (action: GameAction) => {
                gameEvent.actions.push(action);
            },
            gameData: game,
            actions: [],
            validateAnswer: gameModule.functions.validateAnswer,
            processAnswer: gameModule.functions.processAnswer,
            getNextAnswer: gameModule.functions.getNextAnswer,
        } as GameEvent;

        return gameEvent;
    }

}

export default new GameService();