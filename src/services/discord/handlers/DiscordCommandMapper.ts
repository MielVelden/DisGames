import { SlashCommandBuilder } from '@discordjs/builders';
import { Command, CommandOptionType } from '../../../interfaces/application/Command';

class DiscordInteractionMapper {
    public mapCommandToSlashCommandBuilder(command: Command): SlashCommandBuilder {
        const builder = new SlashCommandBuilder()
            .setName(command.name)
            .setDescription(command.description.getMessage());

        if (command.options) {
            for (const option of command.options) {
                switch (option.type) {
                    case CommandOptionType.STRING:
                        builder.addStringOption(stringOption => {
                            stringOption
                                .setName(option.name)
                                .setDescription(option.description.getMessage())
                                .setRequired(option.required || false);

                            if (option.choices && option.choices.length > 0) {
                                stringOption.addChoices(...option.choices.map(choice => ({
                                    name: choice.name.getMessage(),
                                    value: choice.value
                                })));
                            }

                            return stringOption;
                        });
                        break;
                    case CommandOptionType.INTEGER:
                        builder.addIntegerOption(intOption => {
                            intOption
                                .setName(option.name)
                                .setDescription(option.description.getMessage())
                                .setRequired(option.required || false);

                            if (option.choices && option.choices.length > 0) {
                                intOption.addChoices(...option.choices.map(choice => ({
                                    name: choice.name.getMessage(),
                                    value: parseInt(choice.value)
                                })));
                            }

                            return intOption;
                        });
                        break;
                    case CommandOptionType.SUB_COMMAND:
                        builder.addSubcommand(subCommand => {
                            subCommand
                                .setName(option.name)
                                .setDescription(option.description.getMessage());

                            if (option.options) {
                                for (const subOption of option.options) {
                                    // Recursively handle sub-options
                                    this.addOptionToBuilder(subCommand, subOption);
                                }
                            }

                            return subCommand;
                        });
                        break;
                    case CommandOptionType.SUB_COMMAND_GROUP:
                        builder.addSubcommandGroup(subGroup => {
                            subGroup
                                .setName(option.name)
                                .setDescription(option.description.getMessage());

                            if (option.options) {
                                for (const subOption of option.options) {
                                    if (subOption.type === CommandOptionType.SUB_COMMAND) {
                                        subGroup.addSubcommand(subCommand => {
                                            subCommand
                                                .setName(subOption.name)
                                                .setDescription(subOption.description.getMessage());

                                            if (subOption.options) {
                                                for (const subSubOption of subOption.options) {
                                                    this.addOptionToBuilder(subCommand, subSubOption);
                                                }
                                            }

                                            return subCommand;
                                        });
                                    }
                                }
                            }

                            return subGroup;
                        });
                        break;
                }
            }
        }

        return builder;
    }

    public addOptionToBuilder(builder: any, option: any): void {
        switch (option.type) {
            case CommandOptionType.STRING:
                builder.addStringOption((stringOption: any) => {
                    stringOption
                        .setName(option.name)
                        .setDescription(option.description)
                        .setRequired(option.required || false);

                    if (option.choices && option.choices.length > 0) {
                        stringOption.addChoices(...option.choices);
                    }

                    return stringOption;
                });
                break;
            case CommandOptionType.INTEGER:
                builder.addIntegerOption((intOption: any) => {
                    intOption
                        .setName(option.name)
                        .setDescription(option.description)
                        .setRequired(option.required || false);

                    if (option.choices && option.choices.length > 0) {
                        intOption.addChoices(...option.choices.map((choice: any) => ({
                            name: choice.name,
                            value: parseInt(choice.value)
                        })));
                    }

                    return intOption;
                });
                break;
        }
    }

}

export default new DiscordInteractionMapper();