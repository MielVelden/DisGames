import axios from 'axios';
import { DEBUG_DISCORD_WEBHOOK_URL, DISCORD_WEBHOOK_URL } from '../../config';
import { EmbedConfig } from '../../interfaces/application/DiscordEmbed';

export enum WebhookType {
    INFO = 'INFO',
    DEBUG = 'DEBUG',
}

class Webhook {
    public static async sendDiscordEmbed(embed: EmbedConfig, webhookType: WebhookType = WebhookType.INFO): Promise<void> {
        if (!DISCORD_WEBHOOK_URL)
            return;

        let webhookUrl: string = DISCORD_WEBHOOK_URL;
        switch (webhookType) {
            case WebhookType.DEBUG:
                if (DEBUG_DISCORD_WEBHOOK_URL)
                    webhookUrl = DEBUG_DISCORD_WEBHOOK_URL;
                break;
            default:
                webhookUrl = DISCORD_WEBHOOK_URL;
        }

        try {
            await axios.post(webhookUrl, {
                embeds: [embed]
            });
        } catch (error) {
            console.error('[Webhook] Failed to send Discord webhook:', error);
        }
    }
}

export default Webhook;
