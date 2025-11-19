import { Request, Response, NextFunction } from "express";
import { getConfigValue } from "../utils/application/Config";
import { EnvConfigEnum } from "../interfaces/enums/application/EnvConfigEnum";
import { ExceptionEnum } from "../interfaces/enums";
import { ErrorHelper } from "../utils/application/Error";

const validKeys = getConfigValue(EnvConfigEnum.DISGAMES_DASHBOARD_API_KEYS) as string;
if (!validKeys)
	ErrorHelper.throwWithParameters(ExceptionEnum.ENV_VARIABLE_NOT_SET, { key: EnvConfigEnum.DISGAMES_DASHBOARD_API_KEYS });

const VALID_KEYS = validKeys
	.split(",")
	.map((x) => x.trim())
	.filter(Boolean);

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
	const key = req.header("X-API-Key") || (req.query.apiKey as string);
	if (!key || !VALID_KEYS.includes(key))
		return res.status(401).json({ error: "invalid_api_key" });

	const oauthAccess = req.header("X-OAuth-Access");
	const discordUserId = req.header("X-Discord-UserId");
	(res.locals as any).oauth = { access: oauthAccess, discordUserId };
	(res.locals as any).permissions = ["dashboard:read", "dashboard:write"];
	next();
}
