import { GameEvent, GameModule, GameOptionEnum, GameType } from "../../interfaces/domain/Game";

export default {
    config: {
        id: GameType.NUMBER_GUESS,
        name: "NumberGuess",
        description: "Raad het juiste getal tussen 1 en 100",
        points: 1,
        options: {
            [GameOptionEnum.IS_ACTIVE]: true,
            [GameOptionEnum.ALLOW_MESSAGE_CHANGE]: false
        }
    },

    functions: {
        validateAnswer(event: GameEvent): boolean {
            throw new Error("Not implemented");
        },

        processAnswer(event: GameEvent): void {
            throw new Error("Not implemented");

        },

        getNextAnswer(event: GameEvent): string {
            throw new Error("Not implemented");
        }
    }
} as GameModule;