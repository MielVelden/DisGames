import { JobModule } from "../interfaces/application/Job";
import { discordClient } from "..";
import Logger from "../utils/application/Logger";
import { WebhookType } from "../interfaces/enums/application/Webhook";
import UserRepository from "../repositories/UserRepository";
import ServerRepository from "../repositories/ServerRepository";
import GameRepository from "../repositories/GameRepository";
import PointRepository from "../repositories/PointRepository";

export default {
    id: 'basic-metrics',
    name: 'Basic Metrics',
    description: 'Collect basic metrics',
    isEnabled: true,
    cronExpression: '0 0 2 * * *',

    handler: async (progress): Promise<void> => {
        const guilds = discordClient.guilds.cache.size;
        const members = discordClient.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

        const users = await UserRepository.getTotalUsersAsync();
        const servers = await ServerRepository.getTotalMembersAsync();
        const totalPoints = await PointRepository.getTotalPointsAsync();

        const message = `
            **Daily Metrics:**
            Guilds: ${guilds}
            Members: ${members}
            Users: ${users}
            Servers: ${servers}
            Total Points: ${totalPoints}`;

        Logger.logInfo(message, {
            webhookType: WebhookType.INFO,
            sendToDiscord: true,
        });

        progress(1, 1, 'Basic metrics collected');
    }
} as JobModule;