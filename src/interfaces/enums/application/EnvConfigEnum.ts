import { LogLevel } from "../../../utils/application/Logger";

export enum EnvConfigEnum {
    DISGAMES_API_PORT = "DISGAMES_API_PORT",
    DATABASE_URL = "DATABASE_URL",
    TEST_DATABASE_URL = "TEST_DATABASE_URL",
    DEBUG_DISCORD_WEBHOOK_URL = "DEBUG_DISCORD_WEBHOOK_URL",
    DEBUG_MODE = "DEBUG_MODE",
    DISCORD_CLIENT_ID = "DISCORD_CLIENT_ID",
    DISCORD_OWNER_ID = "DISCORD_OWNER_ID",
    DISCORD_WEBHOOK_URL = "DISCORD_WEBHOOK_URL",
    PREFIX = "PREFIX",
    TOKEN = "TOKEN",
    TEST_TIMEOUT = "TEST_TIMEOUT",
    TEST_ROLLBACK = "TEST_ROLLBACK",
    TEST_DISCORD_WEBHOOK_URL = "TEST_DISCORD_WEBHOOK_URL",
	DISGAMES_DASHBOARD_API_KEYS = "DISGAMES_DASHBOARD_API_KEYS",
}

const configTypeDefaults = {
    [EnvConfigEnum.DISGAMES_API_PORT]: 3600,
    [EnvConfigEnum.DATABASE_URL]: "",
    [EnvConfigEnum.TEST_DATABASE_URL]: "",
    [EnvConfigEnum.DEBUG_DISCORD_WEBHOOK_URL]: "",
    [EnvConfigEnum.DEBUG_MODE]: false,
    [EnvConfigEnum.DISCORD_CLIENT_ID]: "",
    [EnvConfigEnum.DISCORD_OWNER_ID]: "",
    [EnvConfigEnum.DISCORD_WEBHOOK_URL]: "",
    [EnvConfigEnum.PREFIX]: "",
    [EnvConfigEnum.TOKEN]: "",
    [EnvConfigEnum.TEST_TIMEOUT]: 30000,
    [EnvConfigEnum.TEST_ROLLBACK]: false,
    [EnvConfigEnum.TEST_DISCORD_WEBHOOK_URL]: "",
    [EnvConfigEnum.DISGAMES_DASHBOARD_API_KEYS]: "changeme1,changeme2",
} as const satisfies Record<EnvConfigEnum, boolean | number | string | string[]>;

type ConfigTypeDefaults = typeof configTypeDefaults;

type Widen<T> = T extends boolean ? boolean : T extends number ? number : string;

export type ConfigValueTypeMap = {
    [K in keyof ConfigTypeDefaults]: Widen<ConfigTypeDefaults[K]>;
};

export const CONFIG_TYPE_DEFAULTS = configTypeDefaults;
