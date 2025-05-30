import { Command, CommandOption, CommandOptionType } from "../interfaces/application/Command";
import { InteractionEvent, MessageInteractionEvent, SlashCommandInteractionEvent } from "../interfaces/application/Event";
import { ActionButton, ButtonStyle, ComponentType } from "../interfaces/application/Message";
import { Permission } from "../interfaces/application/Permission";
import ComponentService from "../services/ComponentService";
import DiscordService from "../services/DiscordService";
import GameService from "../services/GameService";

enum ActionEnum {
    MANAGE = "manage",
    HELP = "help",
    SETUP = "setup"
}

export class DefaultCommand implements Command {
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
                const gameModules = GameService.getGames();
                const selectMenu = ComponentService.createSelectMenu({
                    custom_id: "game",
                    type: ComponentType.STRING_SELECT,
                    options: gameModules.map(game => ({
                        label: game.config.name,
                        value: game.config.id.toString()
                    }))
                });

                const gameEvent = await event.getUserInputBySelectMenuAsync(selectMenu);
                if (gameEvent) {
                    await gameEvent.clearComponentsAsync();
                    await gameEvent.addComponentAsync(ComponentService.createContent("Result: " + gameEvent.selected));
                    await gameEvent.editAsync();   
                }
                break;
        }
    }
}

export default new DefaultCommand(); 