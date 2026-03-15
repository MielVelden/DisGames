import { z, ZodError, ZodIssue, ZodTypeAny } from "zod";
import { CONFIG_TYPE_DEFAULTS, ConfigValueTypeMap, EnvConfigEnum } from "../../interfaces/enums/application/EnvConfigEnum";
import { MetadataKeyEnum } from "../../interfaces/enums/application/MetadataKeyEnum";
import { getEnumAsList } from "../helpers/Enum";
import { getEnumProperty } from "../helpers/EnumMetadata";
import { ExceptionEnum } from "../../interfaces/enums/application/ExpectionEnum";
import { assertNever, ErrorHelper } from "./Error";
import TestMode from "./TestMode";

type ConfigSchemaShape = {
    [K in EnvConfigEnum]: ZodTypeAny;
};

let configCache: ConfigValueTypeMap | null = null;
let schemaCache: z.ZodObject<ConfigSchemaShape> | null = null;

function createSchemaShape(): ConfigSchemaShape {
    const schemaShape = {} as ConfigSchemaShape;
    const enumValues = getEnumAsList(EnvConfigEnum);

    enumValues.forEach(enumValue => {
        const isRequired = (getEnumProperty(EnvConfigEnum, enumValue, MetadataKeyEnum.IsRequired) as boolean | undefined) ?? false;
        const validateRegex = getEnumProperty(EnvConfigEnum, enumValue, MetadataKeyEnum.ValidateRegex) as string | undefined;

        const validator = buildValidator(enumValue, validateRegex);
        if(TestMode.isEnabled()) {
            const isRequiredInTestMode = (getEnumProperty(EnvConfigEnum, enumValue, MetadataKeyEnum.IsRequiredInTestMode) as boolean | undefined) ?? false;
            if(isRequiredInTestMode)
                schemaShape[enumValue] = validator;
            else
                schemaShape[enumValue] = validator.optional();
        }
        else
            schemaShape[enumValue] = isRequired ? validator : validator.optional();
    });

    return schemaShape;
}

function buildValidator(enumValue: EnvConfigEnum, validateRegex?: string): ZodTypeAny {
    const sampleValue = CONFIG_TYPE_DEFAULTS[enumValue];

    switch (typeof sampleValue) {
        case "boolean":
            return buildBooleanValidator();
        case "number":
            return buildNumberValidator();
        case "string":
            return buildStringValidator(validateRegex);
        default:
            assertNever(sampleValue, { [enumValue]: enumValue });
    }
}

function buildStringValidator(validateRegex?: string): ZodTypeAny {
    let stringSchema = z.string();
    if (validateRegex)
        stringSchema = stringSchema.regex(new RegExp(validateRegex));
    return stringSchema;
}

function buildNumberValidator(): ZodTypeAny {
    return z.preprocess(value => {
        if (typeof value === "string" && value.trim().length > 0) {
            const parsed = Number(value);
            if (!Number.isNaN(parsed))
                return parsed;
        }
        return value;
    }, z.number());
}

function buildBooleanValidator(): ZodTypeAny {
    return z.preprocess(value => {
        if (typeof value === "string") {
            const lowerValue = value.toLowerCase();
            if (lowerValue === "true")
                return true;
            if (lowerValue === "false")
                return false;
        }
        return value;
    }, z.boolean());
}

function getSchema(): z.ZodObject<ConfigSchemaShape> {
    if (!schemaCache)
        schemaCache = z.object(createSchemaShape());
    return schemaCache;
}

function readEnvValues(): Record<EnvConfigEnum, unknown> {
    const values = {} as Record<EnvConfigEnum, unknown>;
    const enumValues = getEnumAsList(EnvConfigEnum);

    enumValues.forEach(enumValue => {
        values[enumValue] = process.env[enumValue];
    });

    return values;
}

export function getConfig(): ConfigValueTypeMap {
    if (configCache)
        return configCache;

    const schema = getSchema();
    const envValues = readEnvValues();
    const parsedConfig = parseConfig(envValues, schema);

    configCache = parsedConfig;
    return configCache;
}

function parseConfig(values: Record<EnvConfigEnum, unknown>, schema: z.ZodObject<ConfigSchemaShape>): ConfigValueTypeMap {
    try {
        const parsedValues = schema.parse(values) as Partial<ConfigValueTypeMap>;
        return applyDefaults(parsedValues);
    } catch (error) {
        throw buildConfigError(error);
    }
}

function applyDefaults(parsedValues: Partial<ConfigValueTypeMap>): ConfigValueTypeMap {
    const completedValues: Record<EnvConfigEnum, ConfigValueTypeMap[EnvConfigEnum] | undefined> = {} as Record<EnvConfigEnum, ConfigValueTypeMap[EnvConfigEnum] | undefined>;
    const enumValues = getEnumAsList(EnvConfigEnum);

    enumValues.forEach(enumValue => {
        const value = parsedValues[enumValue];
        if (value !== undefined) {
            completedValues[enumValue] = value;
            return;
        }

        const defaultValue = CONFIG_TYPE_DEFAULTS[enumValue];
        if (defaultValue !== undefined) {
            completedValues[enumValue] = defaultValue;
            return;
        }

        completedValues[enumValue] = undefined;
    });

    return completedValues as ConfigValueTypeMap;
}

function buildConfigError(error: unknown): Error {
    if (error instanceof ZodError)
        error.issues.forEach(issue => formatIssue(issue));

    throw error;
}

function formatIssue(issue: ZodIssue): void {
    const key = String(issue.path[0] ?? "INVALID_CONFIG_KEY");

    if (issue.code === "invalid_type" && issue.received === "undefined")
        ErrorHelper.throwWithParameters(ExceptionEnum.FIELD_IS_MISSING_AND_REQUIRED, { key: key });

    if (issue.code === "invalid_type")
        ErrorHelper.throwWithParameters(ExceptionEnum.FIELD_HAS_INVALID_TYPE, { key: key, received: issue.received, expected: issue.expected });

    if (issue.code === "invalid_string" && issue.validation === "regex")
        ErrorHelper.throwWithParameters(ExceptionEnum.FIELD_HAS_INVALID_VALUE, { key: key });

    ErrorHelper.throwWithParameters(ExceptionEnum.FIELD_HAS_INVALID_VALUE, { key: key });
}

export function getConfigValue<T extends EnvConfigEnum>(key: T): ConfigValueTypeMap[T] {
    if (!configCache)
        getConfig();

    return configCache![key];
}