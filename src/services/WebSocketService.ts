import { WebSocket, WebSocketServer } from "ws";
import { TableEnum } from "../interfaces/enums";

type Subscription = { table: TableEnum; objectId?: number };

export class WebSocketService {
	private clients: Map<string, { socket: WebSocket; subs: Subscription[] }> = new Map();

	constructor(private wss: WebSocketServer) {
		wss.on("connection", (socket) => {
			const id = Math.random().toString(36).slice(2);
			this.clients.set(id, { socket, subs: [] });
			socket.on("message", (raw) => {
				try {
					const msg = JSON.parse(raw.toString());
					if (msg?.type === "subscribe") this.subscribeClient(id, msg.table, msg.objectId);
					if (msg?.type === "unsubscribe") this.unsubscribeClient(id, msg.table, msg.objectId);
				} catch { 
					/* ignore */ 
				}
			});
			socket.once("close", () => this.clients.delete(id));
		});
	}

	async broadcastTableUpdate(table: TableEnum, objectId: number, data: any): Promise<void> {
		for (const { socket, subs } of this.clients.values()) {
			if (subs.some((s) => s.table === table && (s.objectId === undefined || s.objectId === objectId))) {
				try { socket.send(JSON.stringify({ type: "update", table, objectId, data })); } catch {}
			}
		}
	}

	async subscribeClient(clientId: string, table: TableEnum, objectId?: number): Promise<void> {
		const client = this.clients.get(clientId);
		if (!client) return;
		client.subs.push({ table, objectId });
	}

	async unsubscribeClient(clientId: string, table: TableEnum, objectId?: number): Promise<void> {
		const client = this.clients.get(clientId);
		if (!client) return;
		client.subs = client.subs.filter((s) => !(s.table === table && s.objectId === objectId));
	}
}
