import { Command, CommandOptionFollowUpType, CommandOptionType } from "../interfaces/application/Command";
import { SlashCommandInteractionEvent } from "../interfaces/application/Event";
import { SelectMenu } from "../interfaces/application/Message";
import { Permission } from "../interfaces/application/Permission";
import { GameTypeEnum, LanguageEnum } from "../interfaces/enums";
import { GamesCommandActionEnum, GamesCommandFollowUpKeysEnum } from "../interfaces/enums/commands/Games";
import ComponentService from "../services/ComponentService";
import GameService from "../services/GameService";
import { createDeleteButton, createMoveButton } from "../utils/Button";
import { createActiveGameContainer, createGameHelpContainer, createGameSetupConfirmationContainer } from "../utils/Container";
import { i18n } from "../utils/i18n/i18n";
import { MultiLingualString } from "../utils/i18n/MultiLangualString";
import { createChannelSelectMenu, createGamesSelectMenu } from "../utils/SelectMenu";

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
                        const gameId = Number(event.getFollowUpOption(GamesCommandFollowUpKeysEnum.ACTIVE_GAMES)) as GameTypeEnum;  
                        const game = await GameService.getGameByServerIdAndGameIdAsync(event.guildId, gameId);
                        await event.addComponentsAsync(createActiveGameContainer(game, [
                            createMoveButton(event.user.id, async (btnEvent) => {
                                const channelSelectMenu = createChannelSelectMenu();
                                const channelEvent = await btnEvent.getUserInputBySelectMenuAsync(channelSelectMenu);
                                if(channelEvent) {
                                    const channelName = await channelEvent.getChannelNameAsync(channelEvent.selected);
                                    
                                    await GameService.saveAsync({
                                        Id: game.Id,
                                        ChannelId: channelEvent.selected
                                    }, channelEvent);
                                    await channelEvent.addComponentAsync(ComponentService.createContainer({
                                        description: i18n.commands.games.labels.movedToChannel(channelName)
                                    }));
                                    await channelEvent.editAsync();
                                }
                            }),
                            createDeleteButton(event.user.id, async (btnEvent) => {
                                await GameService.deleteAsync(game.Id);
                                await btnEvent.clearComponentsAsync();
                                await btnEvent.editWithComponentAsync(ComponentService.createContainer({
                                    description: new MultiLingualString(i18n.commands.games.labels.deleteSuccess)
                                }));
                            })
                        ]));
                        await event.editAsync();
                    }
                },
                {
                    enumValue: GamesCommandActionEnum.HELP,
                    followUps: [{
                        key: GamesCommandFollowUpKeysEnum.ALL_GAMES,
                        type: CommandOptionFollowUpType.SELECT_MENU,
                        configAsync: async (): Promise<SelectMenu> => {
                            return createGamesSelectMenu(GameService.getGames());
                        }
                    }],
                    handler: async (event: SlashCommandInteractionEvent) => {
                        const gameId = Number(event.getFollowUpOption(GamesCommandFollowUpKeysEnum.ALL_GAMES)) as GameTypeEnum;
                        const helpComponents = createGameHelpContainer(gameId);
                        await event.addComponentsAsync(helpComponents);
                        await event.editAsync();
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
                        const gameTypeEnum = Number(event.getFollowUpOption(GamesCommandFollowUpKeysEnum.ALL_GAMES)) as GameTypeEnum;
                        const gameModule = GameService.getGameByType(gameTypeEnum);
                        const channelName = await event.getChannelNameAsync(event.channelId);
                        
                        const confirmationContainer = createGameSetupConfirmationContainer(
                            gameModule?.config.name.getMessage(event.server.LanguageEnum) || 'Unknown',
                            channelName
                        );

                        const confirmedEvent = await event.getConfirmationFromUser(confirmationContainer);
                        
                        if (confirmedEvent) {
                            await GameService.saveAsync({
                                GameTypeEnum: gameTypeEnum,
                                ChannelId: event.channelId,
                                ServerId: event.guildId
                            }, confirmedEvent);
                            await confirmedEvent.editAsync();
                        }
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