export enum WebSocketEvent {
    UPDATE_RECORD = "UPDATE_RECORD",
    DELETE_RECORD = "DELETE_RECORD",
	PING = "PING",
}

export interface WebSocketMessage {
    event: WebSocketEvent;
    data: any;
}