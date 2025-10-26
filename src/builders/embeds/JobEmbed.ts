import { LogLevel, loggerColors, loggerEmojis } from "../../utils/application/Logger";
import { EmbedConfig } from "../../interfaces/application/DiscordEmbed";

export function createJobReportEmbed(
    successCount: number,
    failedCount: number,
    successfulJobs: string[],
    failedJobs: { jobId: string, error: string }[]
): EmbedConfig {
    const embed: EmbedConfig = {
        title: `${loggerEmojis[LogLevel.DEBUG]} Job Execution Report`,
        description: `**Job execution completed**`,
        color: loggerColors[LogLevel.DEBUG],
        timestamp: new Date().toISOString(),
        footer: {
            text: 'DisGames Job Scheduler'
        },
        fields: [
            {
                name: 'Summary',
                value: `✅ **Successful:** ${successCount}\n❌ **Failed:** ${failedCount}`,
                inline: true
            }
        ]
    };

    if (successfulJobs.length > 0) {
        embed.fields!.push({
            name: 'Successful Jobs',
            value: successfulJobs.map(id => `• ${id}`).join('\n'),
            inline: false
        });
    }

    if (failedJobs.length > 0) {
        embed.fields!.push({
            name: 'Failed Jobs',
            value: failedJobs.map(f => `• ${f.jobId}: ${f.error}`).join('\n'),
            inline: false
        });
    }

    return embed;
}

