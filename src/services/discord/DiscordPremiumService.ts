import ServerService from "../domain/ServerService";
import DiscordMemberService from "./DiscordMemberService";
import MediaService from "../application/MediaService";
import { PREMIUM_NAME } from "../../utils/application/PremiumAccess";
import packageJson from "../../../package.json";
import Logger from "../../utils/application/Logger";

class DiscordPremiumService {
    public async handlePremiumGrantedAsync(guildId: string): Promise<void> {
        const server = await ServerService.setPremiumAsync(guildId, true);
        if (!server)
            return;

        const proLogo = await MediaService.getMediaBufferAsync(MediaService.getBaseImage('pro'));
        await DiscordMemberService.setGuildIdentityAsync(guildId, {
            nickname: packageJson.name + " " + PREMIUM_NAME,
            avatarBuffer: proLogo
        });

        await Logger.logInfo(`Server ${guildId} granted premium access`, { sendToDiscord: true });
    }

    public async handlePremiumRevokedAsync(guildId: string): Promise<void> {
        const server = await ServerService.setPremiumAsync(guildId, false);
        if (!server)
            return;

        await DiscordMemberService.setGuildIdentityAsync(guildId, {
            nickname: null,
            avatarBuffer: null
        });

        await Logger.logInfo(`Server ${guildId} had premium access revoked`, { sendToDiscord: true });
    }
}

export default new DiscordPremiumService();
