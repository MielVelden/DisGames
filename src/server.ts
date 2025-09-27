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
const typegen = new TypeGeneratorController();

app.get("/servers", async (req: express.Request, res: express.Response) => {
    Logger.logInfo("GET /servers");
    const auth = await (api as any).getAuthorizedIdentity(req);
    if (!auth) return res.status(401).json({ error: "unauthorized" });
    res.json(await api.getServers());
});
app.get("/users/:userId", async (req: express.Request, res: express.Response) => {
    Logger.logInfo(`GET /users/${req.params.userId}`);
    const auth = await (api as any).getAuthorizedIdentity(req);
    if (!auth) return res.status(401).json({ error: "unauthorized" });
    res.json(await api.getUserById(req.params.userId));
});
app.get("/users", async (req: express.Request, res: express.Response) => {
    Logger.logInfo("GET /users");
    const auth = await (api as any).getAuthorizedIdentity(req);
    if (!auth) return res.status(401).json({ error: "unauthorized" });
    res.json(await api.getUsers());
});
app.get("/games", async (req: express.Request, res: express.Response) => {
    Logger.logInfo("GET /games");
    const auth = await (api as any).getAuthorizedIdentity(req);
    if (!auth) return res.status(401).json({ error: "unauthorized" });
    res.json(await api.getGames());
});
app.get("/datasheets", async (req: express.Request, res: express.Response) => {
    Logger.logInfo("GET /datasheets");
    const auth = await (api as any).getAuthorizedIdentity(req);
    if (!auth) return res.status(401).json({ error: "unauthorized" });
    res.json(await api.getDataSheets());
});
app.get("/timeline", async (req: express.Request, res: express.Response) => {
    Logger.logInfo("GET /timeline");
    const auth = await (api as any).getAuthorizedIdentity(req);
    if (!auth) return res.status(401).json({ error: "unauthorized" });
    res.json(await api.getTimeline());
});
app.post("/datasheets", async (req: express.Request, res: express.Response) => {
    Logger.logInfo("POST /datasheets");
    const auth = await (api as any).getAuthorizedIdentity(req);
    if (!auth) return res.status(401).json({ error: "unauthorized" });
    res.json(await api.createDataSheet(req.body));
});
app.post("/games/:id", async (req: express.Request, res: express.Response) => {
    Logger.logInfo(`POST /games/${req.params.id}`);
    const auth = await (api as any).getAuthorizedIdentity(req);
    if (!auth) return res.status(401).json({ error: "unauthorized" });
    res.json(await api.updateGame(Number(req.params.id), req.body));
});
app.post("/servers/:id", async (req: express.Request, res: express.Response) => {
    Logger.logInfo(`POST /servers/${req.params.id}`);
    const auth = await (api as any).getAuthorizedIdentity(req);
    if (!auth) return res.status(401).json({ error: "unauthorized" });
    res.json(await api.updateServer(req.params.id, req.body));
});
app.get("/types.ts", async (_req: express.Request, res: express.Response) => {
	const content = await typegen.generateApiTypes();
	res.type("text/plain").send(content);
});

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
wss.on("connection", () => Logger.logInfo("WS connected"));

import { WebSocketService } from "./services/WebSocketService";
export const wsService = new WebSocketService(wss);

export function startHttpServer(port: number) {
	httpServer.listen(port, () => Logger.logInfo(`API listening on :${port}`));
}
