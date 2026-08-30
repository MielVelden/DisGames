import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { apiKeyMiddleware, isValidApiKey } from "./middleware/ApiKeyMiddleware";
import { withRequestContext } from "./middleware/RequestContext";
import { ApiController } from "./controllers/ApiController";
import Logger from "./utils/application/Logger";

const app = express();
app.use(cors());
app.use(express.json());
app.use(withRequestContext);
app.use(apiKeyMiddleware);
const api = new ApiController();

app.use("/api", async (req: express.Request, res: express.Response) => {
	Logger.logDebug(`${req.method} ${req.path}`);
	await api.handleRequest(req, res);
});

const httpServer = createServer(app);
const wss = new WebSocketServer({
	server: httpServer,
	path: "/ws",
	verifyClient: (info, callback) => {
		const url = new URL(info.req.url ?? "", "http://localhost");
		const key = info.req.headers["x-api-key"] ?? url.searchParams.get("apiKey");
		if (!isValidApiKey(Array.isArray(key) ? key[0] : key))
			return callback(false, 401, "invalid_api_key");
		callback(true);
	},
});
wss.on("connection", () => Logger.logInfo("WS connected"));

import { WebSocketService } from "./services/application/WebSocketService";
import { registerService } from "./utils/container/Container";
export const wsService = new WebSocketService(wss);
registerService(wsService);

export function startHttpServer(port: number) {
	httpServer.listen(port, () => Logger.logInfo(`API listening on :${port}`));
}
