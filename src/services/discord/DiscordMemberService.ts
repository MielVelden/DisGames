import {
    Guild,
    GuildMember as DiscordGuildMember,
    Routes,
    DiscordAPIError
} from 'discord.js';
import { discordClient } from "../../";
import { ErrorHelper } from "../../utils/application/Error";
import { ExceptionEnum } from "../../interfaces/enums";
import Logger from "../../utils/application/Logger";

const MAX_AVATAR_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_CONTENT_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

export interface GuildIdentityOptions {
    nickname?: string | null;
    avatarUrl?: string | null;
    avatarBuffer?: Buffer | null;
}

class DiscordMemberService {
    public async fetchMemberAsync(guild: Guild, userId: string): Promise<DiscordGuildMember | null> {
        return await guild.members.fetch(userId);
    }

    public async setGuildIdentityAsync(guildId: string, options: GuildIdentityOptions): Promise<void> {
        const body: Record<string, string | null> = {};

        if (options.nickname !== undefined)
            body.nick = options.nickname;

        if (options.avatarBuffer !== undefined)
            body.avatar = options.avatarBuffer ? this.bufferToDataUri(options.avatarBuffer) : null;
        else if (options.avatarUrl)
            body.avatar = await this.fetchImageAsDataUriAsync(options.avatarUrl);
        else if (options.avatarUrl !== undefined)
            body.avatar = null;

        try {
            // discord.js doesn't wrap this endpoint yet, so it's called as a raw REST route.
            await discordClient.rest.patch(Routes.guildMember(guildId, '@me'), { body });
        } catch (error) {
            if (error instanceof DiscordAPIError && error.status === 429)
                ErrorHelper.wrap(error, ExceptionEnum.DISCORD_RATE_LIMITED);

            Logger.logError(`Failed to update bot identity for guild ${guildId}`, error as Error);
            ErrorHelper.wrap(error, ExceptionEnum.BOT_IDENTITY_UPDATE_FAILED);
        }
    }

    private bufferToDataUri(buffer: Buffer, contentType: string = 'image/png'): string {
        if (buffer.byteLength > MAX_AVATAR_IMAGE_BYTES)
            ErrorHelper.throw(ExceptionEnum.IMAGE_TOO_LARGE);

        return `data:${contentType};base64,${buffer.toString('base64')}`;
    }

    private async fetchImageAsDataUriAsync(url: string): Promise<string> {
        let response: Response;
        try {
            response = await fetch(url);
        } catch (error) {
            ErrorHelper.wrap(error, ExceptionEnum.INVALID_IMAGE_URL);
        }

        if (!response.ok)
            ErrorHelper.throw(ExceptionEnum.INVALID_IMAGE_URL);

        const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
        if (!contentType || !ALLOWED_IMAGE_CONTENT_TYPES.has(contentType))
            ErrorHelper.throw(ExceptionEnum.UNSUPPORTED_IMAGE_FORMAT);

        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.byteLength > MAX_AVATAR_IMAGE_BYTES)
            ErrorHelper.throw(ExceptionEnum.IMAGE_TOO_LARGE);

        return `data:${contentType};base64,${buffer.toString('base64')}`;
    }
}

export default new DiscordMemberService();
