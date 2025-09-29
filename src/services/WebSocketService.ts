import { WebSocket, WebSocketServer } from "ws";
import { TableEnum } from "../interfaces/enums";
import { WebSocketEvent, WebSocketMessage } from "../interfaces/application/WebSocket";

type Subscription = { table: TableEnum; objectId?: number };

export class WebSocketService {
	private clients: Map<string, { socket: WebSocket; subs: Subscription[] }> = new Map();

	constructor(private wss: WebSocketServer) {
		wss.on("connection", (socket) => {
			const id = Math.random().toString(36).slice(2);
			this.clients.set(id, { socket, subs: [] });
			socket.on("message", (raw) => {
				try {
					const msg = JSON.parse(raw.toString()) as WebSocketMessage;

					switch (msg.event) {
						case WebSocketEvent.PING:
							this.handlePing(id);
							break;
						case WebSocketEvent.UPDATE_RECORD:
						case WebSocketEvent.DELETE_RECORD:
							break;
						default: {
							const exhaustiveCheck: never = msg.event;
							throw new Error(`Unhandled web socket event: ${exhaustiveCheck}`);
						}
					}

				} catch {
					/* ignore */
				}
			});
			socket.once("close", () => this.clients.delete(id));
		});
	}

	async subscribeClient(clientId: string, table: TableEnum, objectId?: number): Promise<void> {
		const client = this.clients.get(clientId);
		if (!client) 
			return;
	
		client.subs.push({ table, objectId });
	}

	async unsubscribeClient(clientId: string, table: TableEnum, objectId?: number): Promise<void> {
		const client = this.clients.get(clientId);
		if (!client) 
			return;
	
		client.subs = client.subs.filter((s) => !(s.table === table && s.objectId === objectId));
	}

	private async handlePing(clientId: string): Promise<void> {
		this.sendMessage(clientId, WebSocketEvent.PING, new Date().toISOString());
	}

	private async sendMessage(clientId: string, type: WebSocketEvent, data?: any): Promise<void> {
		const client = this.clients.get(clientId);
		if (!client) 
			throw new Error(`Client not found: ${clientId}`);

		client.socket.send(JSON.stringify({ event: type, data } as WebSocketMessage));
	}
}
