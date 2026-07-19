import { ActionButton, ComponentType } from "../../interfaces/application/Message";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { PersistentButtonEnum } from "../../interfaces/enums/application/ButtonId";

const PREFIX = "p";

function buildPersistentCustomId(id: PersistentButtonEnum, ...payload: string[]): string {
    return [PREFIX, id, ...payload].join(":");
}

export function parsePersistentCustomId(customId: string): { id: PersistentButtonEnum; payload: string[] } | null {
    const [prefix, id, ...payload] = customId.split(":");
    if (prefix !== PREFIX)
        return null;

    return { id: id as PersistentButtonEnum, payload };
}

export function createPersistentButton(id: PersistentButtonEnum, label: MultiLingualString, style: ActionButton["style"], emoji: string | undefined, ...payload: string[]): ActionButton {
    return {
        type: ComponentType.BUTTON,
        custom_id: buildPersistentCustomId(id, ...payload),
        label,
        style,
        emoji,
    };
}
