import {
    ModalBuilder as DiscordModalBuilder,
    TextInputBuilder as DiscordTextInputBuilder,
    ActionRowBuilder as DiscordActionRowBuilder,
    TextInputStyle as DiscordTextInputStyle,
    LabelBuilder as DiscordLabelBuilder,
    StringSelectMenuBuilder as DiscordStringSelectMenuBuilder,
    RadioGroupBuilder as DiscordRadioGroupBuilder,
    RadioGroupOptionBuilder as DiscordRadioGroupOptionBuilder,
} from 'discord.js';
import { ModalDefinition, ModalField, ModalRadioField, ModalSelectField, ModalTextField } from '../../../interfaces/application/Modal';
import { TextInputStyle } from '../../../interfaces/application/Message';
import { MultiLingualString } from '../../../utils/i18n/MultiLingualString';
import { LanguageEnum } from '../../../interfaces/enums/database/LanguageEnum';

class DiscordModalMapper {
    public mapModalToDiscordModal<TFields extends Record<string, ModalField>>(
        customId: string,
        modal: ModalDefinition<TFields>,
        language: LanguageEnum
    ): DiscordModalBuilder {
        const discordModal = new DiscordModalBuilder()
            .setCustomId(customId)
            .setTitle(modal.title.getMessage(language));

        const rows = Object.entries(modal.fields).map(([key, field]) => {
            if (field.kind === 'radio')
                return this.mapFieldToRadioLabelBuilder(key, field, language);
            if (field.kind === 'select')
                return this.mapFieldToSelectLabelBuilder(key, field, language);
            return new DiscordActionRowBuilder<DiscordTextInputBuilder>()
                .addComponents(this.mapFieldToTextInput(key, field as ModalTextField, language));
        });

        discordModal.addComponents(...rows);

        return discordModal;
    }

    private mapFieldToRadioLabelBuilder(key: string, field: ModalRadioField, language: LanguageEnum): DiscordLabelBuilder {
        const radioGroup = new DiscordRadioGroupBuilder()
            .setCustomId(key)
            .setRequired(field.required ?? true)
            .addOptions(field.options.map(opt => {
                const option = new DiscordRadioGroupOptionBuilder()
                    .setLabel(opt.label.getMessage(language))
                    .setValue(opt.value);

                if (opt.description)
                    option.setDescription(opt.description.getMessage(language));
                if (opt.default)
                    option.setDefault(true);

                return option;
            }));

        return new DiscordLabelBuilder()
            .setLabel(field.label.getMessage(language))
            .setRadioGroupComponent(radioGroup);
    }

    private mapFieldToSelectLabelBuilder(key: string, field: ModalSelectField, language: LanguageEnum): DiscordLabelBuilder {
        const select = new DiscordStringSelectMenuBuilder()
            .setCustomId(key)
            .addOptions(field.options.map(opt => ({
                label: opt.label.getMessage(language),
                value: opt.value,
                ...(opt.description && { description: opt.description.getMessage(language) }),
            })));

        if (field.placeholder)
            select.setPlaceholder(field.placeholder.getMessage(language));
        if (field.minValues !== undefined)
            select.setMinValues(field.minValues);
        if (field.maxValues !== undefined)
            select.setMaxValues(field.maxValues);

        return new DiscordLabelBuilder()
            .setLabel(field.label.getMessage(language))
            .setStringSelectMenuComponent(select);
    }

    private mapFieldToTextInput(key: string, field: ModalTextField, language: LanguageEnum): DiscordTextInputBuilder {
        const textInput = new DiscordTextInputBuilder()
            .setCustomId(key)
            .setLabel(field.label.getMessage(language))
            .setStyle(this.mapTextInputStyle(field.style))
            .setRequired(field.required ?? true);

        const placeholder = field.placeholder?.getMessage(language);
        if (placeholder && placeholder.trim().length > 0)
            textInput.setPlaceholder(placeholder);

        const value = this.resolveValue(field.value, language);
        if (value && value.trim().length > 0)
            textInput.setValue(value);

        if (field.minLength !== undefined)
            textInput.setMinLength(field.minLength);

        if (field.maxLength !== undefined)
            textInput.setMaxLength(field.maxLength);

        return textInput;
    }

    private resolveValue(value: ModalTextField['value'], language: LanguageEnum): string | undefined {
        if (value === undefined)
            return undefined;

        return value instanceof MultiLingualString ? value.getMessage(language) : value;
    }

    private mapTextInputStyle(style?: TextInputStyle): DiscordTextInputStyle {
        return style === TextInputStyle.PARAGRAPH ? DiscordTextInputStyle.Paragraph : DiscordTextInputStyle.Short;
    }
}

export default new DiscordModalMapper();
