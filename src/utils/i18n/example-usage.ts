import { InteractionEvent } from "../../interfaces/application/Event";
import { getI18n } from "./index";

export async function exampleCommand(interaction: InteractionEvent): Promise<void> {
    const i18n = getI18n(interaction.server);
    
    const saveText = i18n.commands.save;
    const successMessage = i18n.messages.success;
    const errorMessage = i18n.errors.general;
    
    try {
        await interaction.replyAsync(`${saveText}: ${successMessage}`);
    } catch (error) {
        await interaction.replyAsync(errorMessage);
    }
} 