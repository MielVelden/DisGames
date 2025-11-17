import axios from 'axios';
import { EmbedConfig } from '../../interfaces/application/DiscordEmbed';
import { WebhookType } from '../../interfaces/application';
import { getConfigValue } from './Config';
import { EnvConfigEnum } from '../../interfaces/enums/application/EnvConfigEnum';

class Webhook {
    public static async sendDiscordEmbed(embed: EmbedConfig, webhookType: WebhookType = WebhookType.INFO): Promise<void> {
        const discordWebhookUrl = getConfigValue(EnvConfigEnum.DISCORD_WEBHOOK_URL);
        const debugDiscordWebhookUrl = getConfigValue(EnvConfigEnum.DEBUG_DISCORD_WEBHOOK_URL);
        if (!discordWebhookUrl)
            return;

        let webhookUrl: string = discordWebhookUrl;
        switch (webhookType) {
            case WebhookType.DEBUG:
                if (debugDiscordWebhookUrl)
                    webhookUrl = debugDiscordWebhookUrl;
                break;
            default:
                webhookUrl = discordWebhookUrl;
        }

        try {
            await axios.post(webhookUrl, {
                embeds: [embed]
            });
        } catch (error) {
            console.error('[Webhook] Failed to send Discord webhook:', error); //TODO: FIX THIS
        }
    }
}

export default Webhook;
