import { CommandOptionChoice } from "../interfaces/application/Command";
import { ButtonHandler, EventTypeEnum, HandlerConfig, SelectMenuHandler } from "../interfaces/application/Event";
import { MediaType } from "../interfaces/application/Image";
import { ActionButton, Component, ComponentType, Container, SelectMenu, TextDisplay } from "../interfaces/application/Message";
import { GamesModel } from "../interfaces/database";
import { GameTypeEnum } from "../interfaces/enums";
import { LanguageEnum } from "../interfaces/enums/database/LanguageEnum";
import { i18n, LanguageEnumTranslations } from "../utils/i18n/i18n";
import { MultiLingualString } from "../utils/i18n/MultiLangualString";
import { EventService } from "./EventService";
import MediaService from "./MediaService";

class ComponentService {
    public createButton(config: Omit<ActionButton, "type" | "custom_id">, handlerConfig?: HandlerConfig): ActionButton {
        return this.createComponent({
            type: ComponentType.BUTTON,
            custom_id: crypto.randomUUID(),
            ...config,
        }, EventTypeEnum.BUTTON, handlerConfig);
    }

    public createSelectMenu(config: SelectMenu, handlerConfig?: HandlerConfig): SelectMenu {
        return this.createComponent(config, EventTypeEnum.SELECT_MENU, handlerConfig);
    }

    public createContent(content: MultiLingualString): TextDisplay {
        return {
            type: ComponentType.TEXT_DISPLAY,
            content: content
        };
    }

    private createComponent<T extends Component>(config: T, type: EventTypeEnum, handlerConfig?: HandlerConfig): T {
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

    public createStartMessageAsync(gameTypeEnum: GameTypeEnum, firstAnswer: string): Component {
        const gameImage = MediaService.getGameImage(gameTypeEnum);

        return {
            type: ComponentType.CONTAINER,
            components: [
                {
                    type: ComponentType.TEXT_DISPLAY,
                    content: i18n.commands.games.types[gameTypeEnum].startMessage(firstAnswer)
                },
                {
                    type: ComponentType.MEDIA_GALLERY,
                    items: [
                        {
                            media: {
                                url: gameImage,
                                name: gameTypeEnum,
                                type: MediaType.PNG
                            }
                        }
                    ]
                },
            ]
        } as Container
    }
}

export default new ComponentService();
