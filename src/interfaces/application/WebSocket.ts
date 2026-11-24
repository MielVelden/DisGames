import { EventTypeEnum } from "../enums/application/EventTypeEnum";
import { GameTypeEnum } from "../enums/database/GameTypeEnum";

export enum WebSocketEvent {
    UPDATE_RECORD = "UPDATE_RECORD",
    DELETE_RECORD = "DELETE_RECORD",
	PING = "PING",
	JOB_PROGRESS = "JOB_PROGRESS",
	CLIENT_ID = "CLIENT_ID",
	UPDATE_METRIC = "UPDATE_METRIC",
	LIVE_EVENT = "LIVE_EVENT",
}

export interface WebSocketMessage {
    event: WebSocketEvent;
    data: any;
}

export interface JobProgressData {
	executionId: string;
	jobId: string;
	progress: number;
	current: number;
	total: number;
	message?: string;
}
export interface LiveEventData {
	id: number;
	type: EventTypeEnum;
	createdAt: string;
	user: { displayName: string; username: string; bot: boolean };
	server: { name: string };
	channelId: string;
	commandName?: string;
	content?: string;
	game?: { id: GameTypeEnum; name: string; emoji: string };
}
