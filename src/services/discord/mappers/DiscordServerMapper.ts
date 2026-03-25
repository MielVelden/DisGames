import { Guild as DiscordGuild } from 'discord.js';
import { TimelineEvent } from '../../../interfaces/application/Event';
import { ServersModel, ServersSaveModel } from '../../../interfaces/database/TableInterfaces';
import { LanguageEnum } from '../../../interfaces/enums';
import ServerService from '../../domain/ServerService';
import { normalizeString } from '../../../utils/helpers/String';

export function getTempServer(discordGuild: DiscordGuild): ServersModel {
    return new ServersModel({
        Id: 0,
        ServerId: discordGuild.id,
        Name: discordGuild.name,
        Points: 0,
        LanguageEnum: LanguageEnum.EN,
        MemberCount: discordGuild.memberCount ?? 0
    });
}

export async function getOrCreateServerAsync(discordGuild: DiscordGuild, event: TimelineEvent): Promise<ServersModel> {
    const normalizedGuildName = normalizeString(discordGuild.name);
    let server = await ServerService.getByExternalIdAsync(discordGuild.id).catch(() => undefined);
    if (!server)
        server = await ServerService.saveAsync(new ServersSaveModel({
            ServerId: discordGuild.id,
            Name: normalizedGuildName,
            MemberCount: discordGuild.memberCount
        }), event);

    if (normalizedGuildName !== server.Name)
        await ServerService.updateNameAsync(discordGuild.id, normalizedGuildName);

    if (discordGuild.memberCount !== undefined && discordGuild.memberCount !== server.MemberCount)
        await ServerService.updateMemberCountAsync(discordGuild.id, discordGuild.memberCount);

    return server;
}
