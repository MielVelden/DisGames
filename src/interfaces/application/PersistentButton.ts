import { InteractionEvent } from "./Event";
import { PersistentButtonEnum } from "../enums/application/ButtonId";

export interface PersistentButton {
    id: PersistentButtonEnum;
    handleAsync(interaction: InteractionEvent): Promise<void>;
}
