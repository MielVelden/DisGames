import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { apiKeyMiddleware } from "./middleware/ApiKeyMiddleware";
import { withRequestContext } from "./middleware/RequestContext";
import { ApiController } from "./controllers/ApiController";
import Logger from "./utils/Logger";
import { TypeGeneratorController } from "./controllers/TypeGeneratorController";

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
const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
wss.on("connection", () => Logger.logInfo("WS connected"));

import { WebSocketService } from "./services/application/WebSocketService";
export const wsService = new WebSocketService(wss);

export function startHttpServer(port: number) {
	httpServer.listen(port, () => Logger.logInfo(`API listening on :${port}`));
}
