export enum EnvConfigEnum {
    IS_PRODUCTION = "IS_PRODUCTION",
    DISGAMES_API_ENABLED = "DISGAMES_API_ENABLED",
    DISGAMES_API_PORT = "DISGAMES_API_PORT",
    DATABASE_URL = "DATABASE_URL",
    DEBUG_DISCORD_WEBHOOK_URL = "DEBUG_DISCORD_WEBHOOK_URL",
    DEBUG_MODE = "DEBUG_MODE",
    DISCORD_CLIENT_ID = "DISCORD_CLIENT_ID",
    DISCORD_OWNER_ID = "DISCORD_OWNER_ID",
    DISCORD_WEBHOOK_URL = "DISCORD_WEBHOOK_URL",
    TOKEN = "TOKEN",
    TEST_TIMEOUT = "TEST_TIMEOUT",
    TEST_DISCORD_WEBHOOK_URL = "TEST_DISCORD_WEBHOOK_URL",
	DISGAMES_DASHBOARD_API_KEYS = "DISGAMES_DASHBOARD_API_KEYS",
	DISGAMES_SERVER_ID = "DISGAMES_SERVER_ID",
	DISCORD_PREMIUM_SKU_ID = "DISCORD_PREMIUM_SKU_ID",
    OLLAMA_BASE_URL = "OLLAMA_BASE_URL",
    OLLAMA_MODEL = "OLLAMA_MODEL",
}

const configTypeDefaults = {
    [EnvConfigEnum.IS_PRODUCTION]: false,
    [EnvConfigEnum.DISGAMES_API_ENABLED]: false,
    [EnvConfigEnum.DISGAMES_API_PORT]: 3600,
    [EnvConfigEnum.DATABASE_URL]: "",
    [EnvConfigEnum.DEBUG_DISCORD_WEBHOOK_URL]: "",
    [EnvConfigEnum.DEBUG_MODE]: false,
    [EnvConfigEnum.DISCORD_CLIENT_ID]: "",
    [EnvConfigEnum.DISCORD_OWNER_ID]: "",
    [EnvConfigEnum.DISCORD_WEBHOOK_URL]: "",
    [EnvConfigEnum.TOKEN]: "",
    [EnvConfigEnum.TEST_TIMEOUT]: 30000,
    [EnvConfigEnum.TEST_DISCORD_WEBHOOK_URL]: "",
    [EnvConfigEnum.DISGAMES_DASHBOARD_API_KEYS]: "changeme1,changeme2",
    [EnvConfigEnum.DISGAMES_SERVER_ID]: "",
    [EnvConfigEnum.DISCORD_PREMIUM_SKU_ID]: "",
    [EnvConfigEnum.OLLAMA_BASE_URL]: "http://localhost:11434",
    [EnvConfigEnum.OLLAMA_MODEL]: "llama3.2",
} as const satisfies Record<EnvConfigEnum, boolean | number | string | string[]>;

type ConfigTypeDefaults = typeof configTypeDefaults;

type Widen<T> = T extends boolean ? boolean : T extends number ? number : string;

export type ConfigValueTypeMap = {
    [K in keyof ConfigTypeDefaults]: Widen<ConfigTypeDefaults[K]>;
};

export const CONFIG_TYPE_DEFAULTS = configTypeDefaults;
