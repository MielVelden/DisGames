import { Command, CommandOptionType } from "../interfaces/application/Command";
import { SlashCommandInteractionEvent } from "../interfaces/application/Event";
import { i18n } from "../utils/i18n/i18n";
import { MultiLingualString } from "../utils/i18n/MultiLangualString";
import { CommandEnum } from "../interfaces/enums/commands/CommandEnum";
import { ProfileCommandActionEnum } from "../interfaces/enums/commands/Profile";
import { createProfileContainer } from "../utils/Container";

export class ProfileCommand implements Command {
    name = CommandEnum.PROFILE;
    description = new MultiLingualString(i18n.commands.profile.description);
    isSlashCommand = true;
    isMessageCommand = false;
    permissions = [];
    options = [
        {
            key: i18n.commands.profile.option,
            type: CommandOptionType.STRING,
            required: true,
            choices: [
                {
                    enumValue: ProfileCommandActionEnum.VIEW,
                    handler: async (event: SlashCommandInteractionEvent) => {
                        const profileComponents = createProfileContainer(event.user.userId);
                        await event.addComponentsAsync(profileComponents);
                        await event.replyAsync();
                    }
                },
                {
                    enumValue: ProfileCommandActionEnum.MANAGE,
                    handler: async (event: SlashCommandInteractionEvent) => {
                        const profileComponents = createProfileContainer(event.user.userId);
                        await event.addComponentsAsync(profileComponents);
                        await event.replyAsync();
                    }
                },
            ]
        }
    ];

    async executeAsync(event: SlashCommandInteractionEvent): Promise<void> {
        await event.handleCommandOptionsAsync();
    }
}

export default new ProfileCommand(); 