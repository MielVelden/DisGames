import { GameActionEnum, GameActionPriorityEnum, GameFunctions, GameModule, GameOptionEnum } from "../../interfaces/domain/Game";
import { GameEvent } from "../events/GameEvent";
import { GameTypeEnum, LanguageEnum } from "../../interfaces/enums";
import { i18n } from "../../utils/i18n/i18n";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { GameDataModel, ServersModel } from "../../interfaces/database/TableInterfaces";
import { Component } from "../../interfaces/application/Message";
import ComponentService from "../application/ComponentService";
import GameImageService from "../image/GameImageService";
import { STRING_DELIMITER } from "../../config";
import { DEFAULT_WRONG_ANSWER_EMOJI } from "../../utils/Emojis";

interface ConnectionsGameState {
    gameDataArray: GameDataModel[];
    solvedCategories: number[];
}

function createGameState(gameDataArray: GameDataModel[]): ConnectionsGameState {
    return {
        gameDataArray: gameDataArray,
        solvedCategories: [],
    };
}

function parseGameState(answerString: string): ConnectionsGameState {
    try {
        const parsed = JSON.parse(answerString);

        const gameDataArray = (parsed.gameDataArray || []).map((item: any) => ({
            ...item,
            Response: MultiLingualString.fromJSON(item.Response) || new MultiLingualString({ [LanguageEnum.EN]: '', [LanguageEnum.NL]: '' }),
            Message: MultiLingualString.fromJSON(item.Message) || new MultiLingualString({ [LanguageEnum.EN]: '', [LanguageEnum.NL]: '' })
        }));

        return {
            gameDataArray,
            solvedCategories: parsed.solvedCategories || [],
        };
    } catch {
        return {
            gameDataArray: [],
            solvedCategories: [],
        };
    }
}

function serializeGameState(state: ConnectionsGameState): string {
    return JSON.stringify(state);
}

function validateCategory(words: string[], gameDataArray: GameDataModel[], language: LanguageEnum): number {
    if (words.length !== 4)
        return -1;

    const normalizedWords = words.map(w => w.trim().toUpperCase());

    for (let categoryIndex = 0; categoryIndex < gameDataArray.length; categoryIndex++) {
        const categoryWords = gameDataArray[categoryIndex].Response.getMessage(language)
            .split(STRING_DELIMITER)
            .map(word => word.trim().toUpperCase())
            .slice(0, 4);

        // Check if all 4 guessed words are in this category
        const matchCount = normalizedWords.filter(word => categoryWords.includes(word)).length;
        if (matchCount === 4) {
            return categoryIndex;
        }
    }

    return -1; // No valid category found
}

function parseWordsFromAnswer(answer: string): string[] {
    if (!answer)
        return [];

    // Split by various delimiters and take first 4 valid words
    const words = answer.split(/[,${STRING_DELIMITER}|\s]+/)
        .map(word => word.trim())
        .filter(word => word.length > 0)
        .slice(0, 4);

    return words;
}

async function createGameImage(gameState: ConnectionsGameState, serverId: string, languageEnum: LanguageEnum): Promise<Component> {
    if (gameState.gameDataArray && gameState.gameDataArray.length === 4) {
        const media = await GameImageService.generateGameImage(
            gameState.gameDataArray,
            serverId,
            languageEnum,
            gameState.solvedCategories
        );

        return ComponentService.createImage(media);
    } else
        throw new Error("Game state is not valid");
}

export default {
    config: {
        id: GameTypeEnum.CONNECTIONS,
        emoji: "🔗",
        name: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.CONNECTIONS].name),
        description: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.CONNECTIONS].description),
        points: 2,
        isCalculated: false,
        expectedType: "string",
        addCorrectReaction: true,
        hasImages: false,
        options: {
            [GameOptionEnum.IS_INACTIVE]: false,
            [GameOptionEnum.DISABLE_MESSAGE_CHANGE]: false,
            [GameOptionEnum.SAME_USER_DISABLED]: false,
            [GameOptionEnum.REMOVE_ON_WRONG_ANSWER]: false,
            [GameOptionEnum.ALLOW_SKIPPING]: false,
        }
    },

    functions: {
        validateAnswer(event: GameEvent): boolean {
            const gameState = parseGameState(event.getGameDataAnswer());
            const words = parseWordsFromAnswer(event.userInput as string);
            const categoryIndex = validateCategory(words, gameState.gameDataArray, event.server.LanguageEnum);

            // Check if this is a valid category that hasn't been solved yet
            if (categoryIndex !== -1 && !gameState.solvedCategories.includes(categoryIndex)) {
                // Update the solved categories
                gameState.solvedCategories.push(categoryIndex);
                
                // If there are now 3 categories solved, automatically add the 4th one
                if (gameState.solvedCategories.length === 3) {
                    const allCategories = [0, 1, 2, 3];
                    const missingCategory = allCategories.find(cat => !gameState.solvedCategories.includes(cat));
                    
                    if (missingCategory !== undefined) {
                        gameState.solvedCategories.push(missingCategory);
                    }
                }
                
                // Update the event with the new game state
                event.setGameDataAnswer(serializeGameState(gameState));
                return true;
            }

            // Game is only fully solved if all 4 categories are found
            return gameState.solvedCategories.length === 4;
        },

        async getUpdatedGameAnswerAsync(event: GameEvent): Promise<void> {
            const gameState = parseGameState(event.getGameDataAnswer());
            const userInput = event.userInput as string;
            const words = parseWordsFromAnswer(userInput);
            const categoryIndex = validateCategory(words, gameState.gameDataArray, event.server.LanguageEnum);

            // The game state is already updated in validateAnswer, so we just need to handle the UI
            if (categoryIndex !== -1) {
                event.addAction({
                    enum: GameActionEnum.COMPONENT,
                    priority: GameActionPriorityEnum.HIGH,
                    component: await createGameImage(gameState, event.server.ServerId, event.server.LanguageEnum),
                });
                
                // If all 4 categories are solved, start new game
                const nextAnswer = await event.getNextAnswerAsync();
                if (gameState.solvedCategories.length === 4 && nextAnswer) {
                    const nextGameState = createGameState(nextAnswer);
                    event.setGameDataAnswer(serializeGameState(nextGameState));

                    // New game image
                    event.addAction({
                        enum: GameActionEnum.COMPONENT,
                        priority: GameActionPriorityEnum.MEDIUM,
                        component: await createGameImage(nextGameState, event.server.ServerId, event.server.LanguageEnum),
                    });
                }
            }
        },

        async getStartComponentsAsync(gameData: GameDataModel[], server: ServersModel): Promise<Component[]> {
            const gameState = createGameState(gameData)
            return [
                await createGameImage(gameState, server.ServerId, server.LanguageEnum),
                ComponentService.createContainer({
                    description: i18n.commands.games.types[GameTypeEnum.CONNECTIONS].start!()
                })];
        },

        async onIncorrectAnswerAsync(event: GameEvent): Promise<void> {
            event.addAction({
                enum: GameActionEnum.REACTION,
                priority: GameActionPriorityEnum.HIGH,
                component: DEFAULT_WRONG_ANSWER_EMOJI
            })
        },

        async prepareDataAsync(gameData: GameDataModel[]): Promise<string> {
            return serializeGameState(createGameState(gameData));
        }
    } as GameFunctions
} as GameModule;