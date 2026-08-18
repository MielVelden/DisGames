import { getConfigValue } from '../application/Config';
import { EnvConfigEnum } from '../../interfaces/enums/application/EnvConfigEnum';
import Logger from '../application/Logger';

export type BoundingBox = [minLon: number, minLat: number, maxLon: number, maxLat: number];

export interface MapillaryImage {
    id: string;
    imageUrl: string;
}

interface MapillaryImagesResponse {
    data: Array<{ id: string; thumb_2048_url?: string }>;
}

const MAX_SEARCH_WINDOW_DEGREES = 0.01;

class MapillaryClient {
    private readonly baseUrl = 'https://graph.mapillary.com';

    private get accessToken(): string {
        return getConfigValue(EnvConfigEnum.MAPILLARY_ACCESS_TOKEN) as string;
    }

    async getRandomImageInRegionAsync(regionBbox: BoundingBox, excludeIds: Set<string> = new Set(), maxAttempts = 25): Promise<MapillaryImage | undefined> {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const searchBbox = this.sampleSubBBox(regionBbox);
            const images = await this.fetchImagesInBBoxAsync(searchBbox);
            const candidates = images.filter(image => image.thumb_2048_url && !excludeIds.has(image.id));

            if (candidates.length > 0) {
                const chosen = candidates[Math.floor(Math.random() * candidates.length)];
                return { 
                    id: chosen.id, 
                    imageUrl: chosen.thumb_2048_url! 
                };
            }
        }

        return undefined;
    }

    async downloadImageBufferAsync(imageUrl: string): Promise<Buffer> {
        const response = await fetch(imageUrl);
        if (!response.ok)
            throw new Error(`Failed to download Mapillary image: ${response.status} ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    private sampleSubBBox(regionBbox: BoundingBox): BoundingBox {
        const [minLon, minLat, maxLon, maxLat] = regionBbox;
        const width = Math.min(MAX_SEARCH_WINDOW_DEGREES, maxLon - minLon);
        const height = Math.min(MAX_SEARCH_WINDOW_DEGREES, maxLat - minLat);

        const lon = minLon + Math.random() * (maxLon - minLon - width);
        const lat = minLat + Math.random() * (maxLat - minLat - height);

        return [lon, lat, lon + width, lat + height];
    }

    private async fetchImagesInBBoxAsync(bbox: BoundingBox, limit = 50): Promise<MapillaryImagesResponse['data']> {
        const url = new URL(`${this.baseUrl}/images`);
        url.searchParams.set('access_token', this.accessToken);
        url.searchParams.set('fields', 'id,thumb_2048_url');
        url.searchParams.set('bbox', bbox.join(','));
        url.searchParams.set('limit', String(limit));

        Logger.logInfo(`[MapillaryClient] Fetching images in bbox ${bbox.join(',')}`);

        const response = await fetch(url.toString());
        if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new Error(`Mapillary request failed: ${response.status} ${response.statusText} — ${body}`);
        }

        const data = await response.json() as MapillaryImagesResponse;
        return data.data;
    }
}

export default new MapillaryClient();
