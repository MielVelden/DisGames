import { Command, CommandOptionFollowUpType } from "../../interfaces/application/Command";
import { InteractionEvent, SlashCommandInteractionEvent, SelectMenuInteractionEvent } from "../../interfaces/application/Event";
import { getCommandName } from "../collectors/CommandCollector";
import { DEFAULT_LANGUAGE, MultiLingualString } from "../i18n/MultiLingualString";
import { isSelectMenuEmpty } from "../helpers/SelectMenu";
import ComponentService from "../../services/application/ComponentService";
import { withEventContextAsync } from "../../middleware/EventContext";
import { i18n } from "../i18n/i18n";

export async function handleCommandAsync(command: Command, event: InteractionEvent): Promise<void> {
    await withEventContextAsync(event, async () => {
        if (command.permissions && !event.user.hasPermissions(command.permissions))
            return await event.replyAsync(new MultiLingualString(i18n.labels.common.notEnoughPermissions));
        await command.executeAsync(event);
    });
}

export async function handleCommandOptionsAsync(event: SlashCommandInteractionEvent): Promise<void> {
    return withEventContextAsync(event, async () => {
        if (event.command.options) {
            for (const option of event.command.options) {
                if (option.choices && option.choices.length > 0) {
                    const selectedOption = event.getOption(getCommandName(option.key, DEFAULT_LANGUAGE));
                    const choice = option.choices.find(c => c.enumValue === selectedOption);
                    if (choice) {
                        if (choice.permissions && !event.user.hasPermissions(choice.permissions))
                            return await event.replyAsync(new MultiLingualString(i18n.labels.common.notEnoughPermissions));

                        if (choice.validate) {
                            const isValid = await choice.validate(event);
                            if (!isValid)
                                return await event.replyAsync(new MultiLingualString(option.key.noAction));
                        }

                        if (choice.followUps) {
                            let allFollowUpsCompleted = true;
                            let currentEvent: InteractionEvent = event;
                            for (const followUp of choice.followUps) {
                                if (followUp.type === CommandOptionFollowUpType.SELECT_MENU) {
                                    if (followUp.isRequiredAsync) {
                                        const isRequired = await followUp.isRequiredAsync(event);
                                        if (!isRequired)
                                            continue;
                                    }

                                    const selectMenu = await followUp.configAsync(event);

                                    if (isSelectMenuEmpty(selectMenu)) {
                                        if (followUp.emptyReply) {
                                            await event.addComponentAsync(ComponentService.createContent(followUp.emptyReply));
                                            await event.replyAsync();
                                        }

                                        return;
                                    }

                                    const selectMenuEvent: SelectMenuInteractionEvent | null = await currentEvent.getUserInputBySelectMenuAsync(selectMenu);
                                    if (selectMenuEvent) {
                                        event.setFollowUpOption(followUp.key, selectMenuEvent.selected);
                                        currentEvent = selectMenuEvent;
                                    } else {
                                        allFollowUpsCompleted = false;
                                        break;
                                    }
                                }
                            }

                            if (!allFollowUpsCompleted)
                                return;
                        }

                        if (choice.handler)
                            await choice.handler(event);
                    } else
                        return await event.replyAsync(new MultiLingualString(option.key.noAction));
                }
            }
        }
    });
}

