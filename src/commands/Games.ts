import { Command, CommandOptionType } from "../interfaces/application/Command";
import { SlashCommandInteractionEvent } from "../interfaces/application/Event";
import { Permission } from "../interfaces/application/Permission";
import ComponentService from "../services/ComponentService";
import GameService from "../services/GameService";
import { createGamesSelectMenu } from "../utils/SelectMenu";

enum ActionEnum {
    MANAGE = "manage",
    HELP = "help",
    SETUP = "setup"
}

export class GamesCommand implements Command {
    name = "games";
    description = "Games beheren";
    isSlashCommand = true;
    isMessageCommand = false;
    permissions? = [Permission.ADMINISTRATOR];
    options? = [
        {
            name: "action",
            description: "De actie om uit te voeren",
            type: CommandOptionType.STRING,
            required: true,
            choices: [
                { name: ActionEnum.MANAGE, value: ActionEnum.MANAGE },
                { name: ActionEnum.HELP, value: ActionEnum.HELP },
                { name: ActionEnum.SETUP, value: ActionEnum.SETUP }
            ]
        }
    ];

    async executeAsync(event: SlashCommandInteractionEvent): Promise<void> {
        const action = event.getOption<ActionEnum>("action");

        if (!action) {
            await event.replyAsync("Je moet een actie selecteren.");
            return;
        }

        switch (action) {
            case ActionEnum.MANAGE:
            case ActionEnum.HELP:
                break;
            case ActionEnum.SETUP:
                const selectMenu = createGamesSelectMenu(GameService.getGames());
                const gameEvent = await event.getUserInputBySelectMenuAsync(selectMenu);

                if (gameEvent) {
                    const game = await GameService.saveAsync({
                        GameTypeEnum: Number(gameEvent.selected),
                        ChannelId: event.channelId,
                        ServerId: event.guildId
                    }, event.user);

                    await gameEvent.clearComponentsAsync();
                    await gameEvent.addComponentAsync(ComponentService.createContent("First answer: " + game.Answer));
                    await gameEvent.editAsync();
                }
                break;
        }
    }
}

export default new GamesCommand(); 