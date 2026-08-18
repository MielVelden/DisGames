import { InteractionEvent } from '../../interfaces/application/Event';
import { GameTypeEnum } from '../../interfaces/enums';
import { ExceptionEnum } from '../../interfaces/enums';
import { GameDataSaveModel } from '../../interfaces/database/TableInterfaces';
import { MultiLingualString } from '../../utils/i18n/MultiLingualString';
import { LanguageEnum } from '../../interfaces/enums/database/LanguageEnum';
import { ComponentError } from '../../utils/application/Error';
import OllamaClient from '../../utils/api/OllamaClient';
import GameDataService from '../domain/GameDataService';
import Logger from '../../utils/application/Logger';
import { Service } from "../../interfaces/application/Service";
import { registerService } from "../../utils/container/Container";

export interface GenerationResult {
    generated: number;
    skipped: number;
    failed: string[];
    items: string[];
}

interface GeneratedItem {
    message?: string;
    response: string;
}

function buildPrompt(gameType: GameTypeEnum, theme: string, count: number): string {
    switch (gameType) {
        case GameTypeEnum.ANAGRAM:
            return (
                `Generate ${count} unique words in English (max 1 words) related to the theme "${theme}". ` +
                `Return ONLY a valid JSON array of strings. ` +
                `No explanation, no markdown, just the JSON array.`
            );
        default:
            throw new Error(`Unsupported game type: ${gameType}`);
    }
}

function parseResponse(raw: string, gameType: GameTypeEnum): GeneratedItem[] {
    const matches = [...raw.matchAll(/\[.*?\]/gs)];
    if (matches.length === 0)
        throw new Error('No JSON array found in Ollama response');

    const allItems: GeneratedItem[] = [];

    for (const match of matches) {
        const parsed = JSON.parse(match[0]);

        switch (gameType) {
            case GameTypeEnum.ANAGRAM:
                allItems.push(...(parsed as string[]).map(word => ({
                    response: String(word)
                })));
                break;
            default:
                throw new Error(`Unsupported game type: ${gameType}`);
        }
    }

    return allItems;
}

export class ContentGenerationService extends Service {
    public async initAsync(): Promise<void> {}

    async generateAsync(
        event: InteractionEvent,
        gameType: GameTypeEnum,
        dataSheetId: number | undefined,
        theme: string,
        count = 20,
    ): Promise<GenerationResult> {
        const prompt = buildPrompt(gameType, theme, count);
        const raw = await OllamaClient.generateAsync(prompt);

        let items: GeneratedItem[];
        try {
            items = parseResponse(raw, gameType);
        } catch (err) {
            Logger.logWarning(`[ContentGenerationService] Failed to parse Ollama response: ${err}`);
            throw new Error(`Could not parse Ollama response. Raw: ${raw.slice(0, 200)}`);
        }

        const result: GenerationResult = { generated: 0, skipped: 0, failed: [], items: [] };

        for (const item of items) {
            try {
                const savable = new GameDataSaveModel({
                    GameId: gameType,
                    DataSheetId: dataSheetId,
                    Message: item.message ? MultiLingualString.fromJSON({ [LanguageEnum.EN]: item.message })! : undefined,
                    Response: MultiLingualString.fromJSON({ [LanguageEnum.EN]: item.response })!,
                });

                await GameDataService.saveAsync(savable, event);
                result.generated++;
                result.items.push(item.response);
            } catch (err) {
                if (err instanceof ComponentError && err.errorKey === ExceptionEnum.RECORD_IS_DUPLICATE) {
                    result.skipped++;
                } else {
                    result.failed.push(item.response);
                    Logger.logWarning(`[ContentGenerationService] Failed to save "${item.response}": ${err}`);
                }
            }
        }

        return result;
    }
}

const contentGenerationService = new ContentGenerationService();
registerService(contentGenerationService);
export default contentGenerationService;
