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
        LanguageEnum: LanguageEnum.EN,
        MemberCount: discordGuild.memberCount ?? 0
    });
}

export async function getOrCreateServerAsync(discordGuild: DiscordGuild, event: TimelineEvent): Promise<ServersModel> {
    const normalizedGuildName = normalizeString(discordGuild.name);
    let server = await ServerService.getByExternalIdAsync(discordGuild.id).catch(() => undefined);
    if (!server)
        return await ServerService.saveAsync(new ServersSaveModel({
            ServerId: discordGuild.id,
            Name: normalizedGuildName,
            MemberCount: discordGuild.memberCount
        }), event);

    const nameChanged = normalizedGuildName !== server.Name;
    // MemberCount updates disabled for now: concurrent saves to the same server row
    // race between the old/new snapshot reads in ServerService.performSaveAsync,
    // causing this field to bleed into unrelated timeline diffs (e.g. language changes).

    if (nameChanged)
        server = await ServerService.saveAsync(new ServersSaveModel({
            Id: server.Id,
            Name: normalizedGuildName
        }), event);

    return server;
}
