import { Command, CommandOptionConfig, CommandOptionFollowUpType, CommandOptionType } from "../interfaces/application/Command";
import { SlashCommandInteractionEvent } from "../interfaces/application/Event";
import { SelectMenu } from "../interfaces/application/Message";
import { Permission } from "../interfaces/enums/application/Permission";
import { GameTypeEnum } from "../interfaces/enums";
import { GamesCommandActionEnum, GamesCommandFollowUpKeysEnum } from "../interfaces/enums/commands/Games";
import ComponentService from "../services/application/ComponentService";
import GameService from "../services/domain/GameService";
import { createDeleteButton } from "../builders/buttons/DeleteButton";
import { createGameContainerAsync } from "../builders/containers/GameContainer";
import { createChannelSelectMenu } from "../builders/selectmenus/ChannelSelectMenu";
import { i18n } from "../utils/i18n/i18n";
import { MultiLingualString } from "../utils/i18n/MultiLingualString";
import { createGamesSelectMenu } from "../builders/selectmenus/GamesSelectMenu";
import { CommandEnum } from "../interfaces/enums/commands/CommandEnum";
import { createGameHelpContainer } from "../builders/containers/GameHelpContainer";
import { createMoveButton } from "../builders/buttons/MoveButton";
import { createGameSetupConfirmationContainerAsync } from "../builders/containers/GameSetupConfirmationContainer";
import { GamesSaveModel } from "../interfaces/database";
import { createTitle } from "../utils/helpers/Markdown";

const optionsConfig = [
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
                    isRequiredAsync: async (event: SlashCommandInteractionEvent) => {
                        const game = await GameService.getGameByChannelIdAsync(event.channelId);
                        if (game) {
                            event.setFollowUpOption(GamesCommandFollowUpKeysEnum.ACTIVE_GAMES, game.GameTypeEnum);
                            return false;
                        }
                        return true;
                    },
                    configAsync: async (event: SlashCommandInteractionEvent): Promise<SelectMenu> => {
                        return createGamesSelectMenu(await GameService.getActiveGamesAsync(event.server.ServerId));
                    },
                    emptyReply: new MultiLingualString(i18n.commands.games.labels.noActiveGames)
                }],
                permissions: [Permission.ADMINISTRATOR],
                handler: async (event: SlashCommandInteractionEvent) => {
                    const gameId = Number(event.getFollowUpOption(GamesCommandFollowUpKeysEnum.ACTIVE_GAMES)) as GameTypeEnum;
                    const game = await GameService.getGameByServerIdAndGameIdAsync(event.guildId, gameId);

                    await event.addComponentsAsync(await createGameContainerAsync(game, [
                        createMoveButton(event.user.userId, async (btnEvent) => {
                            const channelSelectMenu = createChannelSelectMenu();
                            const channelEvent = await btnEvent.getUserInputBySelectMenuAsync(channelSelectMenu);
                            if (channelEvent) {
                                const channelName = await channelEvent.getChannelNameAsync(channelEvent.selected);

                                await GameService.saveAsync(new GamesSaveModel({
                                    Id: game.Id,
                                    ChannelId: channelEvent.selected
                                }), channelEvent);
                                await channelEvent.addComponentAsync(ComponentService.createContent(createTitle(new MultiLingualString(i18n.commands.games.labels.movedToChannel.title))));
                                await channelEvent.addComponentAsync(ComponentService.createContent(i18n.commands.games.labels.movedToChannel.description(channelName)));
                                await channelEvent.editAsync();
                            }
                        }),
                        createDeleteButton(event.user.userId, async (btnEvent) => {
                            await GameService.deleteAsync(game.Id!);
                            await btnEvent.clearComponentsAsync();
                            await btnEvent.editWithComponentsAsync([ComponentService.createContent(createTitle(new MultiLingualString(i18n.commands.games.labels.deleteSuccess.title))), ComponentService.createContent(new MultiLingualString(i18n.commands.games.labels.deleteSuccess.description))]);
                        })
                    ], game.Settings, event.server.LanguageEnum));
                    await event.replyAsync();
                }
            },
            {
                enumValue: GamesCommandActionEnum.HELP,
                followUps: [{
                    key: GamesCommandFollowUpKeysEnum.ALL_GAMES,
                    type: CommandOptionFollowUpType.SELECT_MENU,
                    configAsync: async (_event: SlashCommandInteractionEvent): Promise<SelectMenu> => {
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
                    configAsync: async (_event: SlashCommandInteractionEvent): Promise<SelectMenu> => {
                        return createGamesSelectMenu(GameService.getGames());
                    }
                }],
                permissions: [Permission.ADMINISTRATOR],
                handler: async (event: SlashCommandInteractionEvent) => {
                    const gameTypeEnum = Number(event.getFollowUpOption(GamesCommandFollowUpKeysEnum.ALL_GAMES)) as GameTypeEnum;
                    const gameModule = await GameService.getGameByTypeAsync(gameTypeEnum);
                    const channelName = await event.getChannelNameAsync(event.channelId);
                    const gameName = gameModule?.config.name.getMessage(event.server.LanguageEnum) || 'Unknown';

                    // Games with settings: a single modal covers configuration and confirmation at once
                    if (gameModule?.config.settings && gameModule.config.settings.length > 0) {

                        const defaultSettings = GameService.getDefaultSettings(gameModule.config.settings);
                        const draftSummary = await createGameSetupConfirmationContainerAsync(gameName, channelName, gameTypeEnum, defaultSettings, event.server.LanguageEnum);
                        const result = await event.getGameSettingsViaModalAsync(gameModule.config.settings, defaultSettings, draftSummary);

                        if (!result)
                            return; // User cancelled or the modal timed out

                        await GameService.saveAsync(new GamesSaveModel({
                            GameTypeEnum: gameTypeEnum,
                            ChannelId: event.channelId,
                            ServerId: event.guildId,
                            SettingsJSON: result.settings
                        }), result.event);

                        await result.event.editAsync();
                        return;
                    }

                    // Games without settings: unchanged accept/deny confirmation
                    const confirmationContainer = await createGameSetupConfirmationContainerAsync(
                        gameName,
                        channelName,
                        gameTypeEnum,
                        {},
                        event.server.LanguageEnum
                    );

                    const confirmedEvent = await event.getConfirmationFromUserAsync(confirmationContainer);

                    if (confirmedEvent) {
                        await GameService.saveAsync(new GamesSaveModel({
                            GameTypeEnum: gameTypeEnum,
                            ChannelId: event.channelId,
                            ServerId: event.guildId,
                            SettingsJSON: {}
                        }), confirmedEvent);

                        await confirmedEvent.editAsync();
                    }
                }
            }
        ]
    }
] satisfies CommandOptionConfig<GamesCommandActionEnum>[];

export class GamesCommand implements Command {
    name = CommandEnum.GAMES;
    description = new MultiLingualString(i18n.commands.games.description);
    isSlashCommand = true;
    isMessageCommand = false;
    options = optionsConfig;

    async executeAsync(event: SlashCommandInteractionEvent): Promise<void> {
        await event.handleCommandOptionsAsync();
    }
}

export default new GamesCommand(); 