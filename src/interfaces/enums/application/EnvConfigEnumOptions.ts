import { SetIsRequired, SetValidateRegex } from "../../../utils/helpers/EnumMetadata";
import { EnvConfigEnum } from "./EnvConfigEnum";

// Disgames API Port
SetIsRequired(EnvConfigEnum, EnvConfigEnum.DISGAMES_API_PORT);

// Database URL
SetIsRequired(EnvConfigEnum, EnvConfigEnum.DATABASE_URL);
SetValidateRegex(EnvConfigEnum, EnvConfigEnum.DATABASE_URL, /^mysql:\/\/[\w-]+:[\w-]+@[\w-.]+:\d+\/[\w-]+$/);

// Discord Client ID
SetIsRequired(EnvConfigEnum, EnvConfigEnum.DISCORD_CLIENT_ID);

// Discord Owner ID
SetIsRequired(EnvConfigEnum, EnvConfigEnum.DISCORD_OWNER_ID);

// Discord Webhook URL
SetIsRequired(EnvConfigEnum, EnvConfigEnum.DISCORD_WEBHOOK_URL);
SetValidateRegex(EnvConfigEnum, EnvConfigEnum.DISCORD_WEBHOOK_URL, /^https:\/\/(ptb\.|canary\.)?discord\.com\/api\/webhooks\/\d+\/[\w-]+$/);

// Prefix
SetIsRequired(EnvConfigEnum, EnvConfigEnum.PREFIX);

// Token
SetIsRequired(EnvConfigEnum, EnvConfigEnum.TOKEN);

// Dashboard API Keys
SetIsRequired(EnvConfigEnum, EnvConfigEnum.DISGAMES_DASHBOARD_API_KEYS);
SetValidateRegex(
  EnvConfigEnum,
  EnvConfigEnum.DISGAMES_DASHBOARD_API_KEYS,
  /^[^,]+(,[^,]+)*$/
);