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
        
        switch (actie) {
            case ActionEnum.INFO:
                await interactionEvent.replyAsync("Dit is een standaard informatiecommando. Je kunt hier nuttige informatie tonen over je bot.");
                break;
                
            case ActionEnum.HELP:
                // Maak de knoppen
                const docsButton: ActionButton = {
                    type: ComponentType.BUTTON,
                    style: ButtonStyle.PRIMARY,
                    label: "Documentatie",
                    custom_id: "docs_button"
                };
                
                const supportButton: ActionButton = {
                    type: ComponentType.BUTTON,
                    style: ButtonStyle.SECONDARY,
                    label: "Support",
                    custom_id: "support_button"
                };
                
                const helpRow: ActionRow = {
                    type: ComponentType.ACTION_ROW,
                    components: [docsButton, supportButton]
                };
                
                await interactionEvent.replyAsync("Hier is wat hulp voor je! Klik op een van de onderstaande knoppen:");
                await interactionEvent.addComponentAsync(helpRow);
                
                // Wacht op gebruikersinvoer
                const buttonResponse = await interactionEvent.getUserInputAsync("Maak je keuze", [docsButton, supportButton]);
                await buttonResponse.replyAsync("Bedankt voor je keuze!");
                break;
                
            case ActionEnum.VOORBEELD:
                const options: SelectOption[] = [
                    {
                        label: "Optie 1",
                        value: "optie1",
                        description: "Dit is de eerste optie",
                        emoji: { name: "1️⃣" }
                    },
                    {
                        label: "Optie 2",
                        value: "optie2",
                        description: "Dit is de tweede optie",
                        emoji: { name: "2️⃣" }
                    },
                    {
                        label: "Optie 3",
                        value: "optie3",
                        description: "Dit is de derde optie",
                        emoji: { name: "3️⃣" }
                    }
                ];
                
                const selectMenu: StringSelect = {
                    type: ComponentType.STRING_SELECT,
                    custom_id: "example_select",
                    placeholder: "Kies een optie",
                    options: options
                };
                
                const selectRow: ActionRow = {
                    type: ComponentType.ACTION_ROW,
                    components: [selectMenu]
                };
                
                await interactionEvent.replyAsync("Hier is een voorbeeld van een select menu:");
                await interactionEvent.addComponentAsync(selectRow);
                
                // Wacht op gebruikersinvoer
                const selectResponse = await interactionEvent.getUserInputAsync(selectMenu);
                await selectResponse.replyAsync("Je hebt een optie gekozen!");
                await selectResponse.reactAsync("👍");
                break;
                
            default:
                await interactionEvent.replyAsync("Onbekende actie geselecteerd.");
                break;
        }
    }
} 