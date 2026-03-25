import { Guild as DiscordGuild } from 'discord.js';
import { TimelineEvent } from '../../../interfaces/application/Event';
import { ServersModel, ServersSaveModel } from '../../../interfaces/database/TableInterfaces';
import { ExceptionEnum, LanguageEnum } from '../../../interfaces/enums';
import ServerService from '../../domain/ServerService';
import { normalizeString } from '../../../utils/helpers/String';
import { ComponentError } from '../../../utils/application/Error';

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
    let server: ServersModel | undefined;
    
    try {
        server = await ServerService.getByExternalIdAsync(discordGuild.id);
    } catch (error) {
        if (error instanceof ComponentError && error.errorKey === ExceptionEnum.RECORD_NOT_FOUND)
            server = await ServerService.saveAsync(new ServersSaveModel({
                ServerId: discordGuild.id,
                Name: normalizedGuildName
            }), event);
        else
            throw error;
    }

    if (normalizedGuildName !== server.Name)
        server = await ServerService.saveAsync(new ServersSaveModel({
            Id: server.Id,
            Name: normalizedGuildName
        }), event);

    if (discordGuild.memberCount !== undefined && discordGuild.memberCount !== server.MemberCount)
        server = await ServerService.saveAsync(new ServersSaveModel({
            Id: server.Id,
            MemberCount: discordGuild.memberCount
        }), event);

    return server;
}
