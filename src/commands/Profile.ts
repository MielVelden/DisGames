import { Command, CommandOptionType } from "../interfaces/application/Command";
import { InteractionEvent, SelectMenuInteractionEvent, SlashCommandInteractionEvent } from "../interfaces/application/Event";
import { i18n } from "../utils/i18n/i18n";
import { MultiLingualString } from "../utils/i18n/MultiLingualString";
import { CommandEnum } from "../interfaces/enums/commands/CommandEnum";
import { ProfileCommandActionEnum } from "../interfaces/enums/commands/Profile";
import { createProfileContainer } from "../builders/containers/ProfileContainer";
import UserService from "../services/domain/UserService";
import { createAllGamesSelectMenu } from "../builders/selectmenus/GamesSelectMenu";
import { GamesCommandFollowUpKeysEnum } from "../interfaces/enums/commands/Games";
import GameService from "../services/domain/GameService";
import { createProfileGameContainer } from "../builders/containers/ProfileGameContainer";

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
                        const userProfile = await UserService.getUserProfileAsync(event.user.userId);
                        const profileComponents = createProfileContainer(userProfile);
                        await event.addComponentAsync(profileComponents);

                        // Add game switcher
                        const gameSelectMenu = createAllGamesSelectMenu({
                            userId: event.user.userId,
                            handle: async (interaction: InteractionEvent) => {
                                const gameId = Number((interaction as SelectMenuInteractionEvent).selected);
                                const userGameProfile = await UserService.getUserGameProfileAsync(event.user.userId, event.server.ServerId, gameId);
                                const profileGameComponents = createProfileGameContainer(userGameProfile);
                                await interaction.addComponentAsync(profileGameComponents);
                                await interaction.editAsync();
                            }
                        });
                        await event.addComponentAsync(gameSelectMenu);




                        await event.replyAsync();
                    }
                },
                {
                    enumValue: ProfileCommandActionEnum.MANAGE,
                    handler: async (event: SlashCommandInteractionEvent) => {
                        const userProfile = await UserService.getUserProfileAsync(event.user.userId);
                        const profileComponents = createProfileContainer(userProfile);
                        await event.addComponentAsync(profileComponents);
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