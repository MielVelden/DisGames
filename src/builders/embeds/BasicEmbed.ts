import { LogLevel, loggerColors, loggerEmojis } from "../../utils/application/Logger";
import { EmbedConfig } from "../../interfaces/application/DiscordEmbed";

export function createBasicEmbed(level: LogLevel, message: string, error?: Error): EmbedConfig {
    const embed: EmbedConfig = {
        title: `${loggerEmojis[level]} ${level.toUpperCase()}`,
        description: message,
        color: loggerColors[level],
        timestamp: new Date().toISOString(),
        footer: {
            text: 'DisGames Logger'
        },
        fields: []
    };

    if (error) {
        embed.fields!.push({
            name: 'Error Details',
            value: error.message,
            inline: false
        });

        if (error.stack) {
            embed.fields!.push({
                name: 'Stack Trace',
                value: `\`\`\`${error.stack.substring(0, 1000)}\`\`\``,
                inline: false
            });
        }
    }

    return embed;
}

