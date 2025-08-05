import { Games_Settings } from '../../src/interfaces/domain/GameSettings';

export interface InputQueue {
    selectMenuResponses: string[];
    buttonResponses: string[];
    confirmationResponses: boolean[];
    settingsResponses: Games_Settings[];
    inputResponses: string[];
}