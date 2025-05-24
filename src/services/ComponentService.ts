import { ButtonHandler, HandlerConfig } from "../interfaces/application/Event";
import { ActionButton } from "../interfaces/application/Message";
import { EventService } from "./EventService";

class ComponentService {
    public createButton(config: ActionButton, handlerConfig?: HandlerConfig): ActionButton {
        if (!handlerConfig)
            return config;

        const handler: ButtonHandler = {
            ...handlerConfig,
            id: crypto.randomUUID()
        };
        EventService.registerButtonHandler(handler);

        return {
            ...config,
            custom_id: `${handler.id}`
        };
    }

}

export default new ComponentService();
