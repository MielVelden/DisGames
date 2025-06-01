import { CommandOptionChoice } from "../interfaces/application/Command";
import { ButtonHandler, EventType, HandlerConfig, SelectMenuHandler } from "../interfaces/application/Event";
import { ActionButton, Component, ComponentType, SelectMenu, TextDisplay } from "../interfaces/application/Message";
import { LanguageEnum } from "../interfaces/enums/database/LanguageEnum";
import { MultiLingualString } from "../utils/i18n/MultiLangualString";
import { EventService } from "./EventService";

type LanguageEnumTranslations<T extends string | number> = {
    [K in T]: {
        [LanguageEnum.EN]: string;
        [LanguageEnum.NL]: string;
        [LanguageEnum.ES]?: string;
        [LanguageEnum.DE]?: string;
    }
};

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

    public createContent(content: MultiLingualString): TextDisplay {
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

    private createCommandOptionChoice<T extends string | number>(
        enumValue: T, 
        translations: LanguageEnumTranslations<T>
    ): CommandOptionChoice {
        return {
            name: new MultiLingualString(translations[enumValue]),
            value: enumValue as string
        };
    }

    public createCommandOptionChoices<T extends string | number>(
        translations: LanguageEnumTranslations<T>
    ): CommandOptionChoice[] {
        return Object.keys(translations).map(value => this.createCommandOptionChoice(value as T, translations));
    }
}

export default new ComponentService();
