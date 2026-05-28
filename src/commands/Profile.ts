import { Command, CommandOptionConfig, CommandOptionType } from "../interfaces/application/Command";
import { InteractionEvent, isSelectMenuInteractionEvent, SlashCommandInteractionEvent } from "../interfaces/application/Event";
import { i18n } from "../utils/i18n/i18n";
import { createMultiLingualString, MultiLingualString } from "../utils/i18n/MultiLingualString";
import { CommandEnum } from "../interfaces/enums/commands/CommandEnum";
import { ProfileCommandActionEnum } from "../interfaces/enums/commands/Profile";
import { createProfileContainerAsync } from "../builders/containers/ProfileContainer";
import UserService from "../services/domain/UserService";
import { createAllGamesSelectMenu } from "../builders/selectmenus/GamesSelectMenu";
import { createProfileGameContainer } from "../builders/containers/ProfileGameContainer";

const optionsConfig = [
    {
        key: i18n.commands.profile.option,
        type: CommandOptionType.STRING,
        required: true,
        choices: [
            {
                enumValue: ProfileCommandActionEnum.VIEW,
                handler: async (event: SlashCommandInteractionEvent) => {
                    await event.replyAsync(createMultiLingualString('i18n.commands.profile.loadingProfile'));
                    await event.clearComponentsAsync();
                    
                    const userProfile = await UserService.getUserProfileAsync(event.user.userId);
                    const profileComponents = await createProfileContainerAsync(userProfile);
                    await event.addComponentsAsync(profileComponents);

                    // Add game switcher
                    const gameSelectMenu = createAllGamesSelectMenu({
                        userId: event.user.userId,
                        handle: async (interaction: InteractionEvent) => {
                            if (!isSelectMenuInteractionEvent(interaction))
                                return;

                            const gameId = Number(interaction.selected);
                            const userGameProfile = await UserService.getUserGameProfileAsync(event.user.userId, event.server.ServerId, gameId);
                            const profileGameComponents = createProfileGameContainer(userGameProfile);
                            await interaction.addComponentsAsync(profileGameComponents);
                            await interaction.editAsync();
                        }
                    });
                    await event.addComponentAsync(gameSelectMenu);
                    await event.editAsync();
                }
            },
            {
                enumValue: ProfileCommandActionEnum.MANAGE,
                handler: async (event: SlashCommandInteractionEvent) => {
                    const userProfile = await UserService.getUserProfileAsync(event.user.userId);
                    const profileComponents = await createProfileContainerAsync(userProfile);
                    await event.addComponentsAsync(profileComponents);
                    await event.replyAsync();
                }
            },
        ]
    }
] satisfies CommandOptionConfig<ProfileCommandActionEnum>[];

export class ProfileCommand implements Command {
    name = CommandEnum.PROFILE;
    description = new MultiLingualString(i18n.commands.profile.description);
    isSlashCommand = true;
    isMessageCommand = false;
    permissions = [];
    options = optionsConfig;

    async executeAsync(event: SlashCommandInteractionEvent): Promise<void> {
        await event.handleCommandOptionsAsync();
    }
}

export default new ProfileCommand(); 