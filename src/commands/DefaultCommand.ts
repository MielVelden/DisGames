import { Command, CommandOption, CommandOptionType } from "../interfaces/application/Command";
import { InteractionEvent, MessageInteractionEvent, SlashCommandInteractionEvent } from "../interfaces/application/Event";
import { ActionButton, ButtonStyle, ComponentType } from "../interfaces/application/Message";
import { Permission } from "../interfaces/application/Permission";
import ComponentService from "../services/ComponentService";

enum ActionEnum {
    INFO = "info",
    HELP = "help",
    VOORBEELD = "voorbeeld"
}

export class DefaultCommand implements Command {
    name = "default";
    description = "Een standaard test commando";
    isSlashCommand = true;
    isMessageCommand = true;
    permissions? = [Permission.ADMINISTRATOR];
    options? = [
        {
            name: "actie",
            description: "De actie om uit te voeren",
            type: CommandOptionType.STRING,
            required: true,
            choices: [
                { name: ActionEnum.INFO, value: ActionEnum.INFO },
                { name: ActionEnum.HELP, value: ActionEnum.HELP },
                { name: ActionEnum.VOORBEELD, value: ActionEnum.VOORBEELD }
            ]
        }
    ];

    async executeAsync(event: SlashCommandInteractionEvent): Promise<void> {
         const actie = event.getOption<ActionEnum>("actie");

        if (!actie) {
            await event.replyAsync("Je moet een actie selecteren.");
            return;
        }

        switch (actie) {
            case ActionEnum.INFO: {
                const button = ComponentService.createButton({
                    custom_id: "info",
                    type: ComponentType.BUTTON,
                    label: "Info",
                    style: ButtonStyle.SECONDARY,
                    emoji: "✅"
                } as ActionButton, {
                    handle: async (event: InteractionEvent) => {
                        const e = event as MessageInteractionEvent;
                        await e.replyAsync("Info");
                    }
                });
                await event.addComponentAsync(button);
                await event.replyAsync("Info");
                break;
            }
            case ActionEnum.HELP:
                const input = await event.getUserInputByButtonsAsync("Wat is je leeftijd", ["10", "20", "30"]);
                await event.clearComponentsAsync();
                await event.addComponentAsync(ComponentService.createContent(input === null ? "Geen input" : input));
                await event.editAsync();
                break;
            case ActionEnum.VOORBEELD:
                await event.replyAsync("Voorbeeld");
                break;
        }
    }
}

export default new DefaultCommand(); 