export enum EnvConfigEnum {
    DEBUG_DISCORD_WEBHOOK_URL = "DEBUG_DISCORD_WEBHOOK_URL",
    DEBUG_MODE = "DEBUG_MODE",
    DISCORD_CLIENT_ID = "DISCORD_CLIENT_ID",
    DISCORD_OWNER_ID = "DISCORD_OWNER_ID",
    DISCORD_WEBHOOK_URL = "DISCORD_WEBHOOK_URL",
    PREFIX = "PREFIX",
    TOKEN = "TOKEN",
}

const configTypeDefaults = {
    [EnvConfigEnum.DEBUG_DISCORD_WEBHOOK_URL]: "",
    [EnvConfigEnum.DEBUG_MODE]: false,
    [EnvConfigEnum.DISCORD_CLIENT_ID]: "",
    [EnvConfigEnum.DISCORD_OWNER_ID]: "",
    [EnvConfigEnum.DISCORD_WEBHOOK_URL]: "",
    [EnvConfigEnum.PREFIX]: "",
    [EnvConfigEnum.TOKEN]: "",
} as const satisfies Record<EnvConfigEnum, boolean | number | string>;

type ConfigTypeDefaults = typeof configTypeDefaults;

type Widen<T> = T extends boolean ? boolean : T extends number ? number : string;

export type ConfigValueTypeMap = {
    [K in keyof ConfigTypeDefaults]: Widen<ConfigTypeDefaults[K]>;
};

export const CONFIG_TYPE_DEFAULTS = configTypeDefaults;
