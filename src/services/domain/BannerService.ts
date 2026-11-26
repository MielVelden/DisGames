import { Service } from "../../interfaces/application/Service";
import { Media } from "../../interfaces/application/Media";
import { ServersModel } from "../../interfaces/database/TableInterfaces";
import BannerCard, { BannerContent } from "../../builders/cards/BannerCard";
import MediaService from "../application/MediaService";
import StyleService from "./StyleService";
import Logger from "../../utils/application/Logger";
import { i18n } from "../../utils/i18n/i18n";
import { registerService } from "../../utils/container/Container";
import { LanguageTranslations } from "../../interfaces/application/i18n";
import { LanguageEnum } from "../../interfaces/enums";
import { StylePresetConfig } from "../../interfaces/domain/StylePreset";

export type BaseBannerName = 'welcome' | 'aboutme' | 'settings';

// The welcome title already starts with an emoji; the banner shows it on the tile instead.
const stripLeadingEmoji = (translations: LanguageTranslations): LanguageTranslations =>
    Object.fromEntries(Object.entries(translations).map(([language, text]) => [language, text.replace(/^\p{Extended_Pictographic}️?\s*/u, '')])) as LanguageTranslations;

const baseBanners: Record<BaseBannerName, BannerContent> = {
    welcome: { key: 'welcome', emoji: '👋', title: stripLeadingEmoji(i18n.labels.common.welcome.title), description: i18n.labels.common.welcome.description },
    aboutme: { key: 'aboutme', emoji: 'ℹ️', title: i18n.commands.aboutme.labels.title, description: i18n.commands.aboutme.labels.bannerTagline },
    settings: { key: 'settings', emoji: '⚙️', title: i18n.commands.settings.labels.title, description: i18n.commands.settings.labels.description },
};

export class BannerService extends Service {
    public async initAsync(): Promise<void> {}

    public async getBaseBannerAsync(name: BaseBannerName, server?: ServersModel): Promise<Media> {
        if (!server)
            return MediaService.getBaseImage(name);

        try {
            return await this.generateAsync(baseBanners[name], server);
        } catch (error) {
            Logger.logWarning(`Could not generate banner ${name}: ${error}`);
            return MediaService.getBaseImage(name);
        }
    }

    public async pregenerateAllAsync(contents: BannerContent[], progress?: (current: number, total: number, message: string) => void): Promise<number> {
        const all = [...Object.values(baseBanners), ...contents];
        const languages = Object.values(LanguageEnum).filter((l): l is LanguageEnum => typeof l === 'number');
        const jobs: { content: BannerContent; language: LanguageEnum; style: StylePresetConfig | null }[] = [];

        for (const content of all)
            for (const language of languages)
                for (const style of [null, ...StyleService.getPresets().filter(p => !p.languages?.length || p.languages.includes(language))])
                    jobs.push({ content, language, style });

        let rendered = 0;
        for (let i = 0; i < jobs.length; i++) {
            const { content, language, style } = jobs[i];
            const media = await BannerCard.getOrGenerateAsync(content, language, style?.theme.card, style?.id ?? null);
            progress?.(i + 1, jobs.length, media.name);
            rendered++;
        }
        return rendered;
    }

    public async generateAsync(content: BannerContent, server: ServersModel): Promise<Media> {
        const style = StyleService.resolve(server);
        return await BannerCard.getOrGenerateAsync(content, server.LanguageEnum, style.theme.card, style.presetId);
    }
}

const bannerService = new BannerService();
registerService(bannerService);
export default bannerService;
