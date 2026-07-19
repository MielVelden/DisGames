import { PersistentButton } from "../../interfaces/application/PersistentButton";
import { PersistentButtonEnum } from "../../interfaces/enums/application/PersistentButtonEnum";
import { InteractionEvent, isButtonInteractionEvent } from "../../interfaces/application/Event";
import { createPersistentButton, parsePersistentCustomId } from "../../builders/buttons/PersistentButton";
import { createMultiLingualString } from "../../utils/i18n/MultiLingualString";
import { ButtonStyle } from "../../interfaces/application/Message";

export default {
    id: PersistentButtonEnum.COUNTER,

    async handleAsync(interaction: InteractionEvent): Promise<void> {
        if (!isButtonInteractionEvent(interaction))
            return;

        const parsed = parsePersistentCustomId(interaction.customId);
        const nextCount = Number(parsed?.payload[0] ?? "0") + 1;

        const button = createPersistentButton(
            PersistentButtonEnum.COUNTER,
            createMultiLingualString(`Count: ${nextCount}`),
            ButtonStyle.SECONDARY,
            "🔢",
            String(nextCount)
        );

        await interaction.editWithComponentsAsync([button]);
    },
} satisfies PersistentButton;
