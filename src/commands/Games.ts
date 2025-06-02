import { Command, CommandOptionType } from "../interfaces/application/Command";
import { SlashCommandInteractionEvent } from "../interfaces/application/Event";
import { Permission } from "../interfaces/application/Permission";
import { GameTypeEnum } from "../interfaces/enums";
import { GamesCommandActionEnum } from "../interfaces/enums/commands/Games";
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
    permissions? = [Permission.ADMINISTRATOR];
    options? = [
        {
            name: "action",
            description: new MultiLingualString(i18n.commands.games.option.action),
            type: CommandOptionType.STRING,
            required: true,
            choices: ComponentService.createCommandOptionChoices(i18n.commands.games.option.choices)
        }
    ];

    async executeAsync(event: SlashCommandInteractionEvent): Promise<void> {
        const action = event.getOption<GamesCommandActionEnum>("action");

        if (!action) {
            await event.replyAsync(new MultiLingualString(i18n.commands.games.option.noAction));
            return;
        }

        switch (action) {
            case GamesCommandActionEnum.MANAGE:
                const manageEvent = await event.getUserInputBySelectMenuAsync(createGamesSelectMenu(await GameService.getActiveGamesAsync(event.server.ServerId)));
                if (manageEvent) {
                    await manageEvent.clearComponentsAsync();
                    await manageEvent.addComponentAsync(ComponentService.createContent(new MultiLingualString(i18n.commands.games.labels.wantToDelete)));
                    await manageEvent.addComponentAsync(createDeleteButton(event.user.id, async (btnEvent) => {
                        const selected = Number(manageEvent.selected) as GameTypeEnum;
                        const game = await GameService.getGameByServerIdAndGameIdAsync(event.guildId, selected);
                        await GameService.deleteAsync(game.Id);
                        await btnEvent.clearComponentsAsync();
                        await btnEvent.addComponentAsync(ComponentService.createContent(new MultiLingualString(i18n.commands.games.labels.deleteSuccess)));
                        await btnEvent.editAsync();
                    }));
                    await manageEvent.editAsync();
                }
                break;
            case GamesCommandActionEnum.HELP:
                break;
            case GamesCommandActionEnum.SETUP:
                const selectMenu = createGamesSelectMenu(GameService.getGames());
                const gameEvent = await event.getUserInputBySelectMenuAsync(selectMenu);

                if (gameEvent) {
                    const game = await GameService.saveAsync({
                        GameTypeEnum: Number(gameEvent.selected),
                        ChannelId: event.channelId,
                        ServerId: event.guildId
                    }, event.user);

                    await gameEvent.clearComponentsAsync();
                    await gameEvent.addComponentAsync(ComponentService.createContent(new MultiLingualString(i18n.commands.games.labels.success)));
                    await gameEvent.editAsync();
                }
                break;
        }
    }
}

export default new GamesCommand(); 