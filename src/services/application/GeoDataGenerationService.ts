import * as fs from 'fs';
import * as path from 'path';
import { InteractionEvent } from '../../interfaces/application/Event';
import { GameTypeEnum } from '../../interfaces/enums';
import { ExceptionEnum } from '../../interfaces/enums';
import { GameDataSaveModel } from '../../interfaces/database/TableInterfaces';
import { MultiLingualString } from '../../utils/i18n/MultiLingualString';
import { LanguageEnum } from '../../interfaces/enums/database/LanguageEnum';
import { MediaType } from '../../interfaces/application/Media';
import { ComponentError } from '../../utils/application/Error';
import MapillaryClient from '../../utils/api/MapillaryClient';
import { getCountryBoundingBox } from '../../utils/constants/CountryBoundingBoxes';
import GameDataService from '../domain/GameDataService';
import Logger from '../../utils/application/Logger';
import { GenerationResult } from './ContentGenerationService';

class GeoDataGenerationService {
    async generateAsync(
        event: InteractionEvent,
        dataSheetId: number | undefined,
        country: string,
        count = 5,
    ): Promise<GenerationResult> {
        const bbox = getCountryBoundingBox(country);
        if (!bbox)
            throw new Error(`Unknown country "${country}" — add it to CountryBoundingBoxes.ts first.`);

        const existing = await GameDataService.getByGameIdAsync(GameTypeEnum.GUESS_THE_COUNTRY);
        const usedPhotoIds = new Set(
            existing.map(data => data.Message?.getMessage(LanguageEnum.EN)).filter((id): id is string => !!id)
        );

        const result: GenerationResult = { generated: 0, skipped: 0, failed: [], items: [] };

        for (let i = 0; i < count; i++) {
            try {
                const image = await MapillaryClient.getRandomImageInRegionAsync(bbox, usedPhotoIds);
                if (!image) {
                    result.failed.push(`${country} (#${i + 1}): no more unused images found`);
                    continue;
                }

                const buffer = await MapillaryClient.downloadImageBufferAsync(image.imageUrl);

                const savable = new GameDataSaveModel({
                    GameId: GameTypeEnum.GUESS_THE_COUNTRY,
                    DataSheetId: dataSheetId,
                    Message: MultiLingualString.fromJSON({ [LanguageEnum.EN]: image.id })!,
                    Response: MultiLingualString.fromJSON({ [LanguageEnum.EN]: country })!,
                });

                const saved = await GameDataService.saveAsync(savable, event);

                const gameDir = path.join(process.cwd(), 'images', 'games', String(GameTypeEnum.GUESS_THE_COUNTRY));
                await fs.promises.mkdir(gameDir, { recursive: true });
                await fs.promises.writeFile(path.join(gameDir, `${saved.Id}.${MediaType.GIF}`), buffer);

                usedPhotoIds.add(image.id);
                result.generated++;
                result.items.push(country);
            } catch (err) {
                if (err instanceof ComponentError && err.errorKey === ExceptionEnum.RECORD_IS_DUPLICATE) {
                    result.skipped++;
                } else {
                    result.failed.push(`${country} (#${i + 1})`);
                    Logger.logWarning(`[GeoDataGenerationService] Failed to generate image for "${country}": ${err}`);
                }
            }
        }

        return result;
    }
}

export default new GeoDataGenerationService();
