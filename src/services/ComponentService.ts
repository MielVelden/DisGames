import { ButtonHandler, HandlerConfig } from "../interfaces/application/Event";
import { ActionButton, ComponentType, TextDisplay } from "../interfaces/application/Message";
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

    public createContent(content: string): TextDisplay {
        return {
            type: ComponentType.TEXT_DISPLAY,
            content: content
        };
    }
}

export default new ComponentService();
