import { InteractionEvent } from '../../interfaces/application/Event';
import { GameTypeEnum, LanguageEnum } from '../../interfaces/enums';
import { GameDataSaveModel } from '../../interfaces/database/TableInterfaces';
import { MultiLingualString } from '../../utils/i18n/MultiLingualString';
import { LanguageTranslations } from '../../interfaces/application/i18n';
import { getEnumProperty } from '../../utils/helpers/EnumMetadata';
import { MetadataKeyEnum } from '../../interfaces/enums/application/MetadataKeyEnum';
import OllamaClient from '../../utils/api/OllamaClient';
import GameDataService from '../domain/GameDataService';
import Logger from '../../utils/application/Logger';
import { Service } from "../../interfaces/application/Service";
import { registerService } from "../../utils/container/Container";

export interface TranslationResult {
    translated: number;
    skipped: number;
    failed: string[];
}

const LANGUAGE_NAMES: Record<LanguageEnum, string> = {
    [LanguageEnum.EN]: 'English',
    [LanguageEnum.NL]: 'Dutch',
    [LanguageEnum.ES]: 'Spanish',
    [LanguageEnum.DE]: 'German',
    [LanguageEnum.PT]: 'Portuguese',
};

async function translateTextAsync(text: string, targetLanguage: LanguageEnum): Promise<string> {
    const languageName = LANGUAGE_NAMES[targetLanguage];
    const prompt =
        `Translate the English word or short phrase below into ${languageName}.\n` +
        `Rules:\n` +
        `- Reply with ONLY the ${languageName} translation\n` +
        `- One word or short phrase, no punctuation, no parentheses, no explanation\n` +
        `- Do not include the original English word in your reply\n` +
        `- If the word is commonly used as-is in ${languageName}, return it unchanged\n` +
        `- Maximum 4 words\n\n` +
        `Word: ${text}`;

    const raw = await OllamaClient.generateAsync(prompt);
    return sanitizeTranslation(raw);
}

function sanitizeTranslation(raw: string): string {
    return raw
        .split('\n')[0]               // take only the first line
        .replace(/[_*`~#[\]()]/g, '') // strip markdown characters
        .replace(/\s{2,}/g, ' ')      // collapse multiple spaces
        .trim();
}

function getRequiredLanguages(): LanguageEnum[] {
    return (Object.values(LanguageEnum).filter(v => typeof v === 'number') as LanguageEnum[])
        .filter(lang => !!getEnumProperty(LanguageEnum, lang, MetadataKeyEnum.IsRequired));
}

function getMissingLanguages(multiLingualString: MultiLingualString): LanguageEnum[] {
    const existing = multiLingualString.toJSON();
    return getRequiredLanguages().filter(lang => !existing[lang]);
}

export class ContentTranslationService extends Service {
    public async initAsync(): Promise<void> {}

    async translateAsync(gameType: GameTypeEnum, event: InteractionEvent): Promise<TranslationResult> {
        const records = await GameDataService.getByGameIdAsync(gameType);
        const result: TranslationResult = { translated: 0, skipped: 0, failed: [] };

        for (const record of records) {
            const missingInMessage = record.Message ? getMissingLanguages(record.Message) : [];
            const missingInResponse = getMissingLanguages(record.Response);
            const missingLanguages = Array.from(new Set([...missingInMessage, ...missingInResponse]));

            if (missingLanguages.length === 0) {
                result.skipped++;
                continue;
            }

            try {
                const messageJson = record.Message ? record.Message.toJSON() : {};
                const responseJson = record.Response.toJSON();

                const enMessage = messageJson[LanguageEnum.EN];
                const enResponse = responseJson[LanguageEnum.EN];

                for (const lang of missingLanguages) {
                    if (missingInMessage.includes(lang) && enMessage)
                        messageJson[lang] = await translateTextAsync(enMessage, lang);

                    if (missingInResponse.includes(lang) && enResponse)
                        responseJson[lang] = await translateTextAsync(enResponse, lang);
                }

                const savable = new GameDataSaveModel({
                    Id: record.Id,
                    Message: MultiLingualString.fromJSON(messageJson as Record<number, string>) ?? record.Message,
                    Response: MultiLingualString.fromJSON(responseJson as Record<number, string>) ?? record.Response,
                });

                await GameDataService.saveAsync(savable, event);
                result.translated++;
            } catch (err) {
                result.failed.push(String(record.Response.getMessage(LanguageEnum.EN)));
                Logger.logWarning(`[ContentTranslationService] Failed to translate record ${record.Id}: ${err}`);
            }
        }

        return result;
    }
}

const contentTranslationService = new ContentTranslationService();
registerService(contentTranslationService);
export default contentTranslationService;
