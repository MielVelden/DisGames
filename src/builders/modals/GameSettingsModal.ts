import {
    GameSettingsSchema,
    GameSettingsValues,
    isBooleanGameSetting,
    isEnumGameSetting,
    isListGameSetting,
} from "../../interfaces/domain/GameSettings";
import { GameSettingsEnum } from "../../interfaces/enums/games/GameSettingsEnum";
import { ModalDefinition, ModalField } from "../../interfaces/application/Modal";
import { ServersModel } from "../../interfaces/database/TableInterfaces";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import { isServerPremium } from "../../utils/application/PremiumAccess";

const GENERAL_DATASHEET_VALUE = 0;

export function buildGameSettingsModal(
    settingsSchema: GameSettingsSchema,
    currentSettings: GameSettingsValues,
    title: MultiLingualString,
    server: ServersModel
): ModalDefinition<Record<string, ModalField>> {
    const fields: Record<string, ModalField> = {};

    settingsSchema.forEach((setting) => {
        const currentValue = currentSettings[setting.key];

        if (isBooleanGameSetting(setting)) {
            fields[setting.key] = {
                kind: 'checkbox',
                label: setting.label,
                description: setting.description,
                defaultValue: (currentValue as boolean | undefined) ?? setting.defaultValue,
            };
        } else if (isEnumGameSetting(setting)) {
            const selectedValue = currentValue ?? setting.defaultValue;

            fields[setting.key] = {
                kind: 'radio',
                label: setting.label,
                options: setting.options.map(option => ({
                    label: option.label,
                    value: option.value.toString(),
                    description: option.description,
                    default: option.value === selectedValue,
                })),
            };
        } else if (isListGameSetting(setting)) {
            const listValues = Array.isArray(currentValue) ? (currentValue as number[]) : [];
            const isPremiumRestricted = setting.key === GameSettingsEnum.DATASHEETS && !isServerPremium(server);

            fields[setting.key] = {
                kind: 'checkboxGroup',
                label: setting.label,
                minValues: 0,
                maxValues: setting.options.length,
                required: false,
                options: setting.options.map(option => {
                    const optionValue = typeof option.value === "number" ? option.value : Number(option.value);
                    const isPremiumOnlyOption = isPremiumRestricted && optionValue !== GENERAL_DATASHEET_VALUE;

                    return {
                        label: isPremiumOnlyOption
                            ? MultiLingualString.combine([option.label, new MultiLingualString(i18n.commands.games.settings.premiumOnly)], ' ')
                            : option.label,
                        value: option.value.toString(),
                        description: option.description,
                        default: listValues.includes(optionValue),
                    };
                }),
            };
        }
    });

    return { title, fields };
}

export interface GameSettingsModalResult {
    values: GameSettingsValues;
    // True when a non-premium server tried to select a premium-only option (e.g. a specific
    // datasheet) and it had to be dropped from the result.
    premiumRejected: boolean;
}

export function mapGameSettingsModalResult(
    settingsSchema: GameSettingsSchema,
    result: Record<string, unknown>,
    server: ServersModel
): GameSettingsModalResult {
    const values: GameSettingsValues = {};
    let premiumRejected = false;

    settingsSchema.forEach((setting) => {
        const raw = result[setting.key];
        if (raw === undefined)
            return;

        if (isBooleanGameSetting(setting)) {
            values[setting.key] = raw as boolean;
        } else if (isEnumGameSetting(setting)) {
            const match = setting.options.find(option => option.value.toString() === raw);
            if (match)
                values[setting.key] = match.value;
        } else if (isListGameSetting(setting)) {
            const rawValues = raw as string[];
            let selectedValues = setting.options
                .map(option => option.value)
                .filter(value => rawValues.includes(value.toString()))
                .map(value => typeof value === "number" ? value : Number(value));

            if (setting.key === GameSettingsEnum.DATASHEETS && !isServerPremium(server)) {
                const allowedValues = selectedValues.filter(value => value === GENERAL_DATASHEET_VALUE);
                if (allowedValues.length !== selectedValues.length)
                    premiumRejected = true;
                selectedValues = allowedValues;
            }

            values[setting.key] = selectedValues;
        }
    });

    return { values, premiumRejected };
}
