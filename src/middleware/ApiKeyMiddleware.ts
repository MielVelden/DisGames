import { Request, Response, NextFunction } from "express";

if (!process.env.DISGAMES_DASHBOARD_API_KEYS)
	throw new Error("DISGAMES_DASHBOARD_API_KEYS environment variable must be set");

const VALID_KEYS = process.env.DISGAMES_DASHBOARD_API_KEYS
	.split(",")
	.map((x) => x.trim())
	.filter(Boolean);

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
	const key = req.header("X-API-Key") || (req.query.apiKey as string);
	if (!key || !VALID_KEYS.includes(key)) {
		return res.status(401).json({ error: "invalid_api_key" });
	}
	const oauthAccess = req.header("X-OAuth-Access");
	const discordUserId = req.header("X-Discord-UserId");
	(res.locals as any).oauth = { access: oauthAccess, discordUserId };
	(res.locals as any).permissions = ["dashboard:read", "dashboard:write"];
	next();
}
