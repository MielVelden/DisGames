import { WebSocket, WebSocketServer } from "ws";
import { ExceptionEnum, TableEnum } from "../../interfaces/enums";
import { WebSocketEvent, WebSocketMessage, JobProgressData } from "../../interfaces/application/WebSocket";
import { assertNever, ErrorHelper } from "../../utils/application/Error";

type Subscription = { table: TableEnum; objectId?: number };
type JobSubscription = { executionId: string };

export class WebSocketService {
	private clients: Map<string, { socket: WebSocket; subs: Subscription[]; jobSubs: JobSubscription[] }> = new Map();

	constructor(private wss: WebSocketServer) {
		wss.on("connection", (socket) => {
			const id = Math.random().toString(36).slice(2);
			this.clients.set(id, { socket, subs: [], jobSubs: [] });
			
			socket.send(JSON.stringify({
				event: 'CLIENT_ID',
				data: { clientId: id }
			}));

			socket.on("message", (raw) => {
				try {
					const msg = JSON.parse(raw.toString()) as WebSocketMessage;

					switch (msg.event) {
						case WebSocketEvent.PING:
							this.handlePing(id);
							break;
						case WebSocketEvent.UPDATE_RECORD:
						case WebSocketEvent.DELETE_RECORD:
						case WebSocketEvent.JOB_PROGRESS:
						case WebSocketEvent.CLIENT_ID:
							// Explicitly ignored events
							break;
						default: 
							assertNever(msg.event, WebSocketEvent)
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

	async subscribeToJob(clientId: string, executionId: string): Promise<void> {
		const client = this.clients.get(clientId);
		if (!client) 
			return;

		const alreadySubscribed = client.jobSubs.some((sub) => sub.executionId === executionId);
		if (!alreadySubscribed) {
			client.jobSubs.push({ executionId });
		}
	}

	async unsubscribeFromJob(clientId: string, executionId: string): Promise<void> {
		const client = this.clients.get(clientId);
		if (!client) 
			return;

		client.jobSubs = client.jobSubs.filter((sub) => sub.executionId !== executionId);
	}

	async broadcastJobProgress(progressData: JobProgressData): Promise<void> {
		const message: WebSocketMessage = {
			event: WebSocketEvent.JOB_PROGRESS,
			data: progressData
		};

		for (const [clientId, client] of this.clients.entries()) {
			const isSubscribed = client.jobSubs.some((sub) => sub.executionId === progressData.executionId);
			if (isSubscribed) {
				try {
					client.socket.send(JSON.stringify(message));
				} catch {
					
				}
			}
		}
	}

	private async handlePing(clientId: string): Promise<void> {
		this.sendMessage(clientId, WebSocketEvent.PING, new Date().toISOString());
	}

	private async sendMessage(clientId: string, type: WebSocketEvent, data?: any): Promise<void> {
		const client = this.clients.get(clientId);
		if (!client) 
			ErrorHelper.throwWithParameters(ExceptionEnum.CLIENT_NOT_FOUND, { clientId: clientId });

		client.socket.send(JSON.stringify({ event: type, data } as WebSocketMessage));
	}
}
