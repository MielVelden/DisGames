import { TimelineEvent } from "../../interfaces/application";
import { ServersModel, TimelineEntriesSaveModel } from "../../interfaces/database";
import { User } from "../../interfaces/domain";
import TimelineBuilder from "../../services/domain/TimelineBuilder";

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