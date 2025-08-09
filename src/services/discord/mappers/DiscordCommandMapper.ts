import { SlashCommandBuilder } from '@discordjs/builders';
import { Command, CommandOptionType } from '../../../interfaces/application/Command';
import { MultiLingualString } from '../../../utils/i18n/MultiLangualString';
import { getCommandName } from '../../../utils/Commands';

class DiscordInteractionMapper {
    public mapCommandToSlashCommandBuilder(command: Command): SlashCommandBuilder {
        const builder = new SlashCommandBuilder()
            .setName(command.name.toString().toLowerCase())
            .setDescription(command.description.getMessage());

        if (command.options) {
            for (const option of command.options) {
                const nameMessage = getCommandName(option.key);
                const descriptionMessage = new MultiLingualString(option.key.actionDescription).getMessage();
                switch (option.type) {
                    case CommandOptionType.STRING:
                        builder.addStringOption(stringOption => {
                            stringOption
                                .setName(nameMessage)
                                .setDescription(descriptionMessage)
                                .setRequired(option.required || false);

                            if (option.choices && option.choices.length > 0) {
                                stringOption.addChoices(...option.choices.map(choice => {
                                    const choiceName = new MultiLingualString(option.key.choices[choice.enumValue]);
                                    return {
                                        name: choiceName.getMessage(),
                                        value: choice.enumValue.toString()
                                    };
                                }));
                            }

                            return stringOption;
                        });
                        break;
                    case CommandOptionType.INTEGER:
                        builder.addIntegerOption(intOption => {
                            intOption
                                .setName(nameMessage)
                                .setDescription(descriptionMessage)
                                .setRequired(option.required || false);

                            if (option.choices && option.choices.length > 0) {
                                intOption.addChoices(...option.choices.map(choice => {
                                    const choiceName = new MultiLingualString(option.key.choices[choice.enumValue]);
                                    return {
                                        name: choiceName.getMessage(),
                                        value: Number(choice.enumValue)
                                    };
                                }));
                            }

                            return intOption;
                        });
                        break;
                }
            }
        }
        return builder;
    }
}

export default new DiscordInteractionMapper();