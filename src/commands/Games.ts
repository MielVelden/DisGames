import { Command, CommandOptionType } from "../interfaces/application/Command";
import { SlashCommandInteractionEvent } from "../interfaces/application/Event";
import { Permission } from "../interfaces/application/Permission";
import { GamesCommandActionEnum } from "../interfaces/enums/commands/Games";
import ComponentService from "../services/ComponentService";
import GameService from "../services/GameService";
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
                    await gameEvent.addComponentAsync(ComponentService.createContent(new MultiLingualString(i18n.commands.games.setup.success)));
                    await gameEvent.editAsync();
                }
                break;
        }
    }
}

export default new GamesCommand(); 