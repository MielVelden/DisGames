import { ButtonHandler, EventType, HandlerConfig, SelectMenuHandler } from "../interfaces/application/Event";
import { ActionButton, Component, ComponentType, SelectMenu, TextDisplay } from "../interfaces/application/Message";
import { EventService } from "./EventService";

class ComponentService {
    public createButton(config: Omit<ActionButton, "type" | "custom_id">, handlerConfig?: HandlerConfig): ActionButton {
        return this.createComponent({
            type: ComponentType.BUTTON,
            custom_id: crypto.randomUUID(),
            ...config,
        }, EventType.BUTTON, handlerConfig);
    }

    public createSelectMenu(config: SelectMenu, handlerConfig?: HandlerConfig): SelectMenu {
        return this.createComponent(config, EventType.SELECT_MENU, handlerConfig);
    }

    public createContent(content: string): TextDisplay {
        return {
            type: ComponentType.TEXT_DISPLAY,
            content: content
        };
    }

    private createComponent<T extends Component>(config: T, type: EventType, handlerConfig?: HandlerConfig): T {
        if (!handlerConfig)
            return config;

        const handler: ButtonHandler | SelectMenuHandler = {
            ...handlerConfig,
            id: crypto.randomUUID()
        };
        console.log(`[INFO] Registering component (type: ${type}) with id: ${handler.id}`);
        EventService.registerHandler(type, handler);

        return {
            ...config,
            custom_id: `${handler.id}`
        };
    }
}

export default new ComponentService();
