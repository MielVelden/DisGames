import { Command, CommandOption, CommandOptionType } from "../interfaces/application/Command";
import { InteractionEvent } from "../interfaces/application/Event";
import { ActionRow, Component, ComponentType, StringSelect, ButtonStyle, SelectOption, ActionButton } from "../interfaces/application/Message";
import { Permission } from "../interfaces/application/Permission";

export enum ActionEnum {
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
    async executeAsync(interactionEvent: InteractionEvent): Promise<void> {
        // Haal de gekozen actie op
        const actie = interactionEvent.getOption("actie") as string;

        if (!actie) {
            await interactionEvent.replyAsync("Je moet een actie selecteren.");
            return;
        }

        console.log(actie)
    }
} 