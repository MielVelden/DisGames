import { CommandOption, CommandOptionChoice, CommandOptionChoiceConfig, CommandOptionConfig } from "../../interfaces/application/Command";
import { ButtonHandler, HandlerConfig, SelectMenuHandler } from "../../interfaces/application/Event";
import { Media } from "../../interfaces/application/Media";
import { ActionButton, Component, ComponentType, Container, ContainerBuilder, SelectMenu, TextDisplay } from "../../interfaces/application/Message";
import { EventTypeEnum, GameTypeEnum } from "../../interfaces/enums";
import { i18n, LanguageEnumTranslations } from "../../utils/i18n/i18n";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { EventService } from "./EventService";
import MediaService from "./MediaService";
import Logger from "../../utils/Logger";

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

    public createContainer(builder: ContainerBuilder): Container {
        return {
            type: ComponentType.CONTAINER,
            title: builder.title,
            footer: builder.footer,
            components: [
                builder.title && {
                    type: ComponentType.TITLE,
                    content: builder.title
                },
                builder.description && {
                    type: ComponentType.TEXT_DISPLAY,
                    content: builder.description
                },
                builder.footer && {
                    type: ComponentType.FOOTER,
                    content: builder.footer
                }
            ]
        } as Container
    }

    private createComponent<T extends Component>(config: T, type: EventTypeEnum, handlerConfig?: HandlerConfig): T {
        if (!handlerConfig)
            return config;

        const handler: ButtonHandler | SelectMenuHandler = {
            ...handlerConfig,
            id: crypto.randomUUID()
        };
        Logger.logDebug(`Registering component (type: ${type}) with id: ${handler.id}`);
        EventService.registerHandler(type, handler);

        return {
            ...config,
            custom_id: `${handler.id}`
        };
    }

    private createCommandOptionChoice<T extends string | number>(
        choice: CommandOptionChoiceConfig<T>,
        translations: LanguageEnumTranslations<T>
    ): CommandOptionChoice {
        return {
            name: new MultiLingualString(translations[choice.enumValue]),
            value: choice.enumValue as string
        };
    }

    public createCommandOptionChoices<T extends string | number>(option: CommandOptionConfig<T>): CommandOption[] {
        return [
            {
                name: new MultiLingualString(option.key.action),
                description: new MultiLingualString(option.key.action),
                type: option.type,
                required: option.required,
                choices: option.choices.map(choice => this.createCommandOptionChoice(choice, option.key.choices))
            }
        ];
    }

    public createStartMessageAsync(gameTypeEnum: GameTypeEnum, firstAnswer: string): Component[] {
        const gameImage = MediaService.getGameImage(gameTypeEnum);

        return [
            {
                type: ComponentType.CONTAINER,
                components: [
                    {
                        type: ComponentType.MEDIA_GALLERY,
                        items: [
                            {
                                media: gameImage
                            }
                        ]
                    },
                ]
            } as Container,
            {
                type: ComponentType.CONTAINER,
                components: [
                    {
                        type: ComponentType.TEXT_DISPLAY,
                        content: i18n.commands.games.types[gameTypeEnum].startMessage(firstAnswer)
                    }
                ]
            } as Container
        ];
    }
    
    public createImage(image: Media): Container {
        return {
            type: ComponentType.CONTAINER,
            components: [
                {
                    type: ComponentType.MEDIA_GALLERY,
                    items: [
                        {
                            media: image
                        }
                    ]
                },
            ]
        } as Container;
    }
}

export default new ComponentService();
