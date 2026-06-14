import {
    ModalBuilder as DiscordModalBuilder,
    TextInputBuilder as DiscordTextInputBuilder,
    ActionRowBuilder as DiscordActionRowBuilder,
    TextInputStyle as DiscordTextInputStyle
} from 'discord.js';
import { ModalDefinition, ModalTextField } from '../../../interfaces/application/Modal';
import { TextInputStyle } from '../../../interfaces/application/Message';
import { MultiLingualString } from '../../../utils/i18n/MultiLingualString';
import { LanguageEnum } from '../../../interfaces/enums/database/LanguageEnum';

// TODO: discord.js 14.19.3's ModalBuilder only supports Text Inputs. To support
// String Selects + Label wrappers inside modals (Components-v2 modals, component
// type 18 / `LabelBuilder`, see the Discord "Using Modal Components" guide), bump
// discord.js and extend ModalTextField / this mapper with select-style fields.
class DiscordModalMapper {
    public mapModalToDiscordModal<TFields extends Record<string, ModalTextField>>(
        customId: string,
        modal: ModalDefinition<TFields>,
        language: LanguageEnum
    ): DiscordModalBuilder {
        const discordModal = new DiscordModalBuilder()
            .setCustomId(customId)
            .setTitle(modal.title.getMessage(language));

        const rows = Object.entries(modal.fields).map(([key, field]) =>
            new DiscordActionRowBuilder<DiscordTextInputBuilder>()
                .addComponents(this.mapFieldToTextInput(key, field, language))
        );

        discordModal.addComponents(...rows);

        return discordModal;
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
