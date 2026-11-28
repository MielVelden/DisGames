import { createHash, timingSafeEqual } from "crypto";
import { Request, Response, NextFunction } from "express";
import { getConfigValue } from "../utils/application/Config";
import { EnvConfigEnum } from "../interfaces/enums/application/EnvConfigEnum";
import { ExceptionEnum } from "../interfaces/enums";
import { ErrorHelper } from "../utils/application/Error";

const validKeys = getConfigValue(EnvConfigEnum.DISGAMES_DASHBOARD_API_KEYS) as string;
if (!validKeys)
	ErrorHelper.throwWithParameters(ExceptionEnum.ENV_VARIABLE_NOT_SET, { environmentVariable: EnvConfigEnum.DISGAMES_DASHBOARD_API_KEYS });

// timingSafeEqual needs inputs of equal length, which hashing guarantees without revealing the key length
const hashKey = (key: string) => createHash("sha256").update(key).digest();

const VALID_KEY_HASHES = validKeys
	.split(",")
	.map((x) => x.trim())
	.filter(Boolean)
	.map(hashKey);

export function isValidApiKey(key: string | undefined | null): boolean {
	if (!key)
		return false;

	const hash = hashKey(key);
	return VALID_KEY_HASHES.reduce((isMatch, validHash) => timingSafeEqual(hash, validHash) || isMatch, false);
}

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
	const key = req.header("X-API-Key");
	if (!isValidApiKey(key))
		return res.status(401).json({ error: "invalid_api_key" });

	const oauthAccess = req.header("X-OAuth-Access");
	(res.locals as any).oauth = { access: oauthAccess };
	(res.locals as any).permissions = ["dashboard:read", "dashboard:write"];
	next();
}
