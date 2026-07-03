import { SetIsRequired, SetIsRequiredInTestMode, SetValidateRegex } from "../../../utils/helpers/EnumMetadata";
import { EnvConfigEnum } from "./EnvConfigEnum";

// Basic required values
SetIsRequired(EnvConfigEnum, EnvConfigEnum.IS_PRODUCTION);
SetIsRequired(EnvConfigEnum, EnvConfigEnum.DISGAMES_API_PORT);
SetIsRequired(EnvConfigEnum, EnvConfigEnum.TOKEN);
SetIsRequiredInTestMode(EnvConfigEnum, EnvConfigEnum.TOKEN);

SetIsRequired(EnvConfigEnum, EnvConfigEnum.DISCORD_CLIENT_ID);
SetValidateRegex(EnvConfigEnum, EnvConfigEnum.DISCORD_CLIENT_ID, /^[0-9]+$/);
SetIsRequired(EnvConfigEnum, EnvConfigEnum.DISCORD_OWNER_ID);
SetIsRequiredInTestMode(EnvConfigEnum, EnvConfigEnum.DISCORD_OWNER_ID);
SetValidateRegex(EnvConfigEnum, EnvConfigEnum.DISCORD_OWNER_ID, /^[0-9]+$/);

// Server ID
SetIsRequired(EnvConfigEnum, EnvConfigEnum.DISGAMES_SERVER_ID);
SetValidateRegex(EnvConfigEnum, EnvConfigEnum.DISGAMES_SERVER_ID, /^[0-9]+$/);

// Database 
SetIsRequired(EnvConfigEnum, EnvConfigEnum.DATABASE_URL);
SetIsRequiredInTestMode(EnvConfigEnum, EnvConfigEnum.DATABASE_URL);
SetValidateRegex(EnvConfigEnum, EnvConfigEnum.DATABASE_URL, /^mysql:\/\/[\w-]+:[\w-]+@[\w-.]+:\d+\/[\w-]+$/);

// Discord Webhook URLs
SetIsRequired(EnvConfigEnum, EnvConfigEnum.DISCORD_WEBHOOK_URL);
SetValidateRegex(EnvConfigEnum, EnvConfigEnum.DISCORD_WEBHOOK_URL, /^https:\/\/(ptb\.|canary\.)?discord\.com\/api\/webhooks\/\d+\/[\w-]+$/);

SetIsRequiredInTestMode(EnvConfigEnum, EnvConfigEnum.TEST_DISCORD_WEBHOOK_URL);
SetValidateRegex(EnvConfigEnum, EnvConfigEnum.TEST_DISCORD_WEBHOOK_URL, /^https:\/\/(ptb\.|canary\.)?discord\.com\/api\/webhooks\/\d+\/[\w-]+$/);
SetIsRequiredInTestMode(EnvConfigEnum, EnvConfigEnum.DEBUG_DISCORD_WEBHOOK_URL);
SetValidateRegex(EnvConfigEnum, EnvConfigEnum.DEBUG_DISCORD_WEBHOOK_URL, /^https:\/\/(ptb\.|canary\.)?discord\.com\/api\/webhooks\/\d+\/[\w-]+$/);

// Dashboard API Keys
SetIsRequired(EnvConfigEnum, EnvConfigEnum.DISGAMES_DASHBOARD_API_KEYS);
SetValidateRegex(
  EnvConfigEnum,
  EnvConfigEnum.DISGAMES_DASHBOARD_API_KEYS,
  /^[^,]+(,[^,]+)*$/
);