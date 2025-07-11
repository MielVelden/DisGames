import { Command, CommandOptionFollowUpType, CommandOptionType } from "../interfaces/application/Command";
import { SlashCommandInteractionEvent } from "../interfaces/application/Event";
import { SelectMenu } from "../interfaces/application/Message";
import { Permission } from "../interfaces/application/Permission";
import { GameTypeEnum } from "../interfaces/enums";
import { GamesCommandActionEnum, GamesCommandFollowUpKeysEnum } from "../interfaces/enums/commands/Games";
import ComponentService from "../services/ComponentService";
import GameService from "../services/GameService";
import { createDeleteButton } from "../utils/Button";
import { i18n } from "../utils/i18n/i18n";
import { MultiLingualString } from "../utils/i18n/MultiLangualString";
import { createGamesSelectMenu } from "../utils/SelectMenu";

export class GamesCommand implements Command {
    name = "games";
    description = new MultiLingualString(i18n.commands.games.description);
    isSlashCommand = true;
    isMessageCommand = false;
    permissions = [Permission.ADMINISTRATOR];
    options = [
        {
            key: i18n.commands.games.option,
            type: CommandOptionType.STRING,
            required: true,
            choices: [
                {
                    enumValue: GamesCommandActionEnum.MANAGE,
                    followUps: [{
                        key: GamesCommandFollowUpKeysEnum.ACTIVE_GAMES,
                        type: CommandOptionFollowUpType.SELECT_MENU,
                        configAsync: async (event: SlashCommandInteractionEvent): Promise<SelectMenu> => {
                            return createGamesSelectMenu(await GameService.getActiveGamesAsync(event.server.ServerId));
                        }
                    }],
                    handler: async (event: SlashCommandInteractionEvent) => {
                        await event.addComponentAsync(ComponentService.createContent(new MultiLingualString(i18n.commands.games.labels.wantToDelete)));
                        await event.addComponentAsync(createDeleteButton(event.user.id, async (btnEvent) => {
                            const game = await GameService.getGameByServerIdAndGameIdAsync(event.guildId, Number(event.getFollowUpOption(GamesCommandFollowUpKeysEnum.ACTIVE_GAMES)) as GameTypeEnum);
                            await GameService.deleteAsync(game.Id);
                            await btnEvent.editWithComponentAsync(ComponentService.createContent(new MultiLingualString(i18n.commands.games.labels.deleteSuccess)));
                        }));
                        await event.editAsync();
                    }
                },
                {
                    enumValue: GamesCommandActionEnum.HELP,
                    handler: async (event: SlashCommandInteractionEvent) => {
                        console.log("HELP");
                    }
                },
                {
                    enumValue: GamesCommandActionEnum.SETUP,
                    followUps: [{
                        key: GamesCommandFollowUpKeysEnum.ALL_GAMES,
                        type: CommandOptionFollowUpType.SELECT_MENU,
                        configAsync: async (): Promise<SelectMenu> => {
                            return createGamesSelectMenu(GameService.getGames());
                        }
                    }],
                    handler: async (event: SlashCommandInteractionEvent) => {
                        await GameService.saveAsync({
                            GameTypeEnum: Number(event.getFollowUpOption(GamesCommandFollowUpKeysEnum.ALL_GAMES)),
                            ChannelId: event.channelId,
                            ServerId: event.guildId
                        }, event);
                        await event.editAsync();
                    }
                }
            ]
        }
    ];

    async executeAsync(event: SlashCommandInteractionEvent): Promise<void> {
        await event.handleCommandOptionsAsync();
    }
}

export default new GamesCommand(); 