import { TimelineEvent } from "../../interfaces/application";
import { ServersModel, TimelineEntriesSaveModel } from "../../interfaces/database";
import { User } from "../../interfaces/domain";
import { ExceptionEnum } from "../../interfaces/enums";
import { EnvConfigEnum } from "../../interfaces/enums/application/EnvConfigEnum";
import ServerService from "../../services/domain/ServerService";
import TimelineBuilder from "../../services/domain/TimelineBuilder";
import UserService from "../../services/domain/UserService";
import { getConfigValue } from "../application/Config";
import { ErrorHelper } from "../application/Error";

export function createBaseTimelineEvent(user: User, server: ServersModel): TimelineEvent {
    const timelineEntries: TimelineEntriesSaveModel[] = [];
    return {
        user: user,
        server: server,
        timelineEntries,
        addTimelineEntry(entry: TimelineEntriesSaveModel): void {
            timelineEntries.push(entry);
        },
        async commitTimelineAsync(): Promise<void> {
            await TimelineBuilder.commitTimelineEntriesAsync(timelineEntries);
        }
    };
}

export async function getSystemEventAsync() {
    const user = await UserService.getSystemUserAsync();
    const server = await ServerService.getByExternalIdAsync(getConfigValue(EnvConfigEnum.DISGAMES_SERVER_ID));
    const event = createBaseTimelineEvent(user, server);
    if (!event)
      ErrorHelper.throw(ExceptionEnum.UNAUTHORIZED);
    return event;
  }