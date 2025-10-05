export enum WebSocketEvent {
    UPDATE_RECORD = "UPDATE_RECORD",
    DELETE_RECORD = "DELETE_RECORD",
	PING = "PING",
	JOB_PROGRESS = "JOB_PROGRESS",
	CLIENT_ID = "CLIENT_ID",
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