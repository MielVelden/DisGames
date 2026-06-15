import {
    StringSelectMenuBuilder as DiscordStringSelectMenuBuilder,
    UserSelectMenuBuilder as DiscordUserSelectMenuBuilder,
    RoleSelectMenuBuilder as DiscordRoleSelectMenuBuilder,
    MentionableSelectMenuBuilder as DiscordMentionableSelectMenuBuilder,
    ChannelSelectMenuBuilder as DiscordChannelSelectMenuBuilder,
    ButtonBuilder as DiscordButtonBuilder,
    ButtonStyle as DiscordJsButtonStyle,
    ActionRowBuilder as DiscordActionRowBuilder,
    MessageFlags as DiscordMessageFlags,
    AttachmentBuilder
} from 'discord.js';
import { ContainerBuilder as DiscordContainerBuilder, SelectMenuOptionBuilder as DiscordSelectMenuOptionBuilder, TextDisplayBuilder as DiscordTextDisplayBuilder, MediaGalleryBuilder as DiscordMediaGalleryBuilder, MediaGalleryItemBuilder as DiscordMediaGalleryItemBuilder, SeparatorBuilder as DiscordSeparatorBuilder } from '@discordjs/builders';
import { BaseInteractionEvent, InteractionEvent } from '../../../interfaces/application/Event';
import { ActionButton, ButtonStyle, ComponentType, Container, Content, Footer, LinkButton, MediaGallery, PremiumButton, SelectMenu, SelectOption, Separator, TextDisplay, Title } from '../../../interfaces/application/Message';
import {
    StringSelect,
    UserSelect,
    RoleSelect,
    MentionableSelect,
    ChannelSelect,
    Component
} from '../../../interfaces/application/Message';
import { createMultiLingualString, MultiLingualString } from '../../../utils/i18n/MultiLingualString';
import DiscordEnumMapper from './DiscordEnumMapper';
import { DiscordComponentBuilder, DiscordMessageContent, DiscordSelectMenuBuilder } from '../DiscordService';
import ComponentService from '../../application/ComponentService';
import { DEFAULT_EMBED_COLOR } from '../../../utils/constants/Colors';
import Logger from '../../../utils/application/Logger';
import MediaService from '../../application/MediaService';
import { withEventContextAsync } from '../../../middleware/EventContext';
import { isPremiumEnabled } from '../../../utils/application/PremiumAccess';
import { UniqueCodes } from '../../../utils/helpers/UniqueCodes';

class DiscordComponentMapper {
    public mapSelectMenuOptionToDiscordSelectMenuOption(option: SelectOption): DiscordSelectMenuOptionBuilder {
        const discordSelectMenuOption = new DiscordSelectMenuOptionBuilder()
            .setLabel(option.label.getMessage())
            .setValue(option.value);

        const description = option.description?.getMessage();
        if (description && description.trim().length > 0)
            discordSelectMenuOption.setDescription(description);

        if (option.emoji)
            discordSelectMenuOption.setEmoji({ name: option.emoji });

        return discordSelectMenuOption;
    }

    public async mapSelectMenuToDiscordSelectMenuAsync(selectMenu: SelectMenu): Promise<DiscordSelectMenuBuilder> {
        switch (selectMenu.type) {
            case ComponentType.STRING_SELECT: {
                const stringSelect = selectMenu as StringSelect;
                const discordSelectMenu = new DiscordStringSelectMenuBuilder()
                    .setCustomId(stringSelect.custom_id)
                    .setDisabled(stringSelect.disabled || false)
                    .setPlaceholder(stringSelect.placeholder?.getMessage() || "Select an option")
                    .setMinValues(stringSelect.min_values || 1)
                    .setMaxValues(stringSelect.max_values || 1);

                if (stringSelect.options) {
                    stringSelect.options.forEach(option => {
                        discordSelectMenu.addOptions(this.mapSelectMenuOptionToDiscordSelectMenuOption(option));
                    });
                }

                return discordSelectMenu;
            }
            case ComponentType.USER_SELECT: {
                const userSelect = selectMenu as UserSelect;
                const discordSelectMenu = new DiscordUserSelectMenuBuilder()
                    .setCustomId(userSelect.custom_id)
                    .setDisabled(userSelect.disabled || false)
                    .setPlaceholder(userSelect.placeholder?.getMessage() || "Select a user")
                    .setMinValues(userSelect.min_values || 1)
                    .setMaxValues(userSelect.max_values || 1);

                if (userSelect.default_values) {
                    discordSelectMenu.setDefaultUsers(userSelect.default_values.map(dv => dv.id));
                }

                return discordSelectMenu;
            }
            case ComponentType.ROLE_SELECT: {
                const roleSelect = selectMenu as RoleSelect;
                const discordSelectMenu = new DiscordRoleSelectMenuBuilder()
                    .setCustomId(roleSelect.custom_id)
                    .setDisabled(roleSelect.disabled || false)
                    .setPlaceholder(roleSelect.placeholder?.getMessage() || "Select a role")
                    .setMinValues(roleSelect.min_values || 1)
                    .setMaxValues(roleSelect.max_values || 1);

                if (roleSelect.default_values) {
                    discordSelectMenu.setDefaultRoles(roleSelect.default_values.map(dv => dv.id));
                }

                return discordSelectMenu;
            }
            case ComponentType.MENTIONABLE_SELECT: {
                const mentionableSelect = selectMenu as MentionableSelect;
                const discordSelectMenu = new DiscordMentionableSelectMenuBuilder()
                    .setCustomId(mentionableSelect.custom_id)
                    .setDisabled(mentionableSelect.disabled || false)
                    .setPlaceholder(mentionableSelect.placeholder?.getMessage() || "Select a mentionable")
                    .setMinValues(mentionableSelect.min_values || 1)
                    .setMaxValues(mentionableSelect.max_values || 1);

                return discordSelectMenu;
            }
            case ComponentType.CHANNEL_SELECT: {
                const channelSelect = selectMenu as ChannelSelect;
                const discordSelectMenu = new DiscordChannelSelectMenuBuilder()
                    .setCustomId(channelSelect.custom_id)
                    .setDisabled(channelSelect.disabled || false)
                    .setPlaceholder(channelSelect.placeholder?.getMessage() || "Select a channel")
                    .setMinValues(channelSelect.min_values || 1)
                    .setMaxValues(channelSelect.max_values || 1);

                if (channelSelect.channel_types) {
                    discordSelectMenu.setChannelTypes(channelSelect.channel_types);
                }

                if (channelSelect.default_values) {
                    discordSelectMenu.setDefaultChannels(channelSelect.default_values.map(dv => dv.id));
                }

                return discordSelectMenu;
            }
            default:
                throw new Error(`Unhandled select menu type: ${(selectMenu as any).type}`);
        }
    }

    public async mapButtonToDiscordButtonAsync(button: ActionButton | LinkButton | PremiumButton): Promise<DiscordButtonBuilder> {
        if (button.style === ButtonStyle.PREMIUM) {
            const premium = button as PremiumButton;
            if (isPremiumEnabled() || !premium.sku_id) {
                return new DiscordButtonBuilder()
                    .setCustomId(UniqueCodes.generateUUID())
                    .setLabel(button.label?.getMessage() || "Button")
                    .setStyle(DiscordJsButtonStyle.Secondary)
                    .setDisabled(true);
            }

            const discordButton = new DiscordButtonBuilder()
                .setStyle(DiscordJsButtonStyle.Premium)
                .setSKUId(premium.sku_id);

            if (premium.disabled)
                discordButton.setDisabled(true);

            return discordButton;
        }

        const discordButton = new DiscordButtonBuilder()
            .setLabel((button as ActionButton | LinkButton).label?.getMessage() || "Button")
            .setStyle(DiscordEnumMapper.mapButtonStyleToDiscordButtonStyle(button.style));

        if (button.style !== ButtonStyle.LINK)
            discordButton.setCustomId((button as ActionButton).custom_id);

        if (button.emoji) {
            if (typeof button.emoji === "string")
                discordButton.setEmoji(button.emoji);
            else
                discordButton.setEmoji({
                    name: button.emoji.name,
                    id: button.emoji.id,
                    animated: button.emoji.animated
                });
        }

        if (button.style === ButtonStyle.LINK)
            discordButton.setURL((button as LinkButton).url);

        if (button.disabled)
            discordButton.setDisabled(true);

        return discordButton;
    }

    public async mapComponentToDiscordComponentAsync(component: Component): Promise<DiscordComponentBuilder> {
        switch (component.type) {
            case ComponentType.BUTTON:
                return await this.mapButtonToDiscordButtonAsync(component as ActionButton | LinkButton | PremiumButton);
            case ComponentType.TEXT_DISPLAY:
                return await this.mapTextDisplayToDiscordTextDisplayAsync(component as TextDisplay);
            case ComponentType.SEPARATOR:
                return await this.mapSeparatorToDiscordSeparatorAsync(component as Separator);
            case ComponentType.STRING_SELECT:
            case ComponentType.USER_SELECT:
            case ComponentType.ROLE_SELECT:
            case ComponentType.MENTIONABLE_SELECT:
            case ComponentType.CHANNEL_SELECT:
                return await this.mapSelectMenuToDiscordSelectMenuAsync(component as SelectMenu);
            case ComponentType.CONTAINER:
                return await this.mapContainerToDiscordContainerAsync(component as Container);
            case ComponentType.MEDIA_GALLERY:
                return await this.mapMediaGalleryToDiscordMediaGalleryAsync(component as MediaGallery);
            case ComponentType.CONTENT:
                throw new Error('Content components should not be mapped to Discord components');
            default:
                throw new Error(`Unhandled component type: ${component.type}`);
        }
    }

    public createActionRowWithComponents(components: DiscordComponentBuilder | DiscordComponentBuilder[]): DiscordActionRowBuilder<any> {
        const componentArray = Array.isArray(components) ? components : [components];
        return new DiscordActionRowBuilder<any>().addComponents(componentArray);
    }

    private excludeComponentsInContainers(components: Component[]): Component[] {
        const componentsInContainers: Set<Component> = new Set();

        // Find all components that are inside containers
        const findComponentsInContainers = (comps: Component[]): void => {
            for (const component of comps) {
                if (component.type === ComponentType.CONTAINER) {
                    const container = component as Container;
                    if (container.components) {
                        container.components.forEach(nestedComp => componentsInContainers.add(nestedComp));
                        findComponentsInContainers(container.components);
                    }
                }
            }
        };

        findComponentsInContainers(components);

        // Return only components that are not inside containers
        return components.filter(component => !componentsInContainers.has(component));
    }

    public async mapActionRowComponentsAsync(components: Component[]): Promise<DiscordActionRowBuilder<any>[]> {
        // Exclude buttons that are already inside containers
        const componentsToProcess = this.excludeComponentsInContainers(components);

        const discordComponents = await Promise.all(componentsToProcess.map(component => this.mapComponentToDiscordComponentAsync(component)));

        // Group components by type - only including ActionRow-compatible components
        const buttons = discordComponents.filter(c => c instanceof DiscordButtonBuilder);
        const selectMenus = discordComponents.filter(c =>
            c instanceof DiscordStringSelectMenuBuilder ||
            c instanceof DiscordUserSelectMenuBuilder ||
            c instanceof DiscordRoleSelectMenuBuilder ||
            c instanceof DiscordMentionableSelectMenuBuilder ||
            c instanceof DiscordChannelSelectMenuBuilder);

        const actionRows: DiscordActionRowBuilder<any>[] = [];

        // Create ActionRow for each type if there are components
        if (buttons.length > 0) {
            actionRows.push(this.createActionRowWithComponents(buttons));
        }

        if (selectMenus.length > 0) {
            // Each select menu must be in its own ActionRow
            selectMenus.forEach(menu => {
                actionRows.push(this.createActionRowWithComponents(menu));
            });
        }

        return actionRows;
    }

    public async mapRootComponentsAsync(components: Component[]): Promise<any[]> {
        // ActionRow components
        const actionRowComponents = await this.mapActionRowComponentsAsync(components.filter(
            component => DiscordEnumMapper.isActionRowComponent(component)
        ));

        // Non-ActionRow components (TextDisplay, MediaGallery, Container)
        const otherComponentPromises = components
            .filter(component => !DiscordEnumMapper.isActionRowComponent(component))
            .map(component => this.mapComponentToDiscordComponentAsync(component));

        const otherComponents = await Promise.all(otherComponentPromises);

        // Return all components together (with type cast to any[] to resolve type incompatibility)
        return [...otherComponents, ...actionRowComponents];
    }

    private async mapTextDisplayToDiscordTextDisplayAsync(textDisplay: TextDisplay | Title | Footer): Promise<DiscordTextDisplayBuilder> {
        switch (textDisplay.type) {
            case ComponentType.TEXT_DISPLAY:
                return new DiscordTextDisplayBuilder()
                    .setContent(textDisplay.content?.getMessage() || "No content");
            case ComponentType.TITLE:
                return new DiscordTextDisplayBuilder()
                    .setContent(`## ${textDisplay.content?.getMessage() || "No content"}`);
            case ComponentType.FOOTER:
                return new DiscordTextDisplayBuilder()
                    .setContent(`-# ${textDisplay.content?.getMessage() || "No content"}`);
            default:
                throw new Error(`Unhandled text display type: ${textDisplay}`);
        }
    }

    private async mapSeparatorToDiscordSeparatorAsync(separator: Separator): Promise<DiscordSeparatorBuilder> {
        const discordSeparator = new DiscordSeparatorBuilder();

        if (separator.divider !== undefined) {
            discordSeparator.setDivider(separator.divider);
        }

        if (separator.spacing !== undefined) {
            // Map spacing values 1 -> Small, 2 -> Large (based on Discord's enum)
            const spacingSize = separator.spacing === 1 ? 1 : 2; // SeparatorSpacingSize.Small : SeparatorSpacingSize.Large
            discordSeparator.setSpacing(spacingSize);
        }

        return discordSeparator;
    }

    private async mapMediaGalleryToDiscordMediaGalleryAsync(mediaGallery: MediaGallery): Promise<DiscordMediaGalleryBuilder> {
        return new DiscordMediaGalleryBuilder()
            .addItems(mediaGallery.items.map(item => {
                const galleryItem = new DiscordMediaGalleryItemBuilder()
                    .setSpoiler(item.spoiler || false);

                // Handle local disk path
                if (item.media.url.startsWith('http:') || item.media.url.startsWith('https:')) {
                    galleryItem.setURL(item.media.url);
                } else {
                    galleryItem.setURL(`attachment://${item.media.name}.${item.media.type}`);
                }

                if (typeof item.description === 'object' && item.description?.getMessage) {
                    galleryItem.setDescription(item.description.getMessage() || "");
                } else if (typeof item.description === 'string') {
                    galleryItem.setDescription(item.description || "");
                } else {
                    galleryItem.setDescription("No description");
                }

                return galleryItem;
            }));
    }

    public async mapContainerToDiscordContainerAsync(container: Container): Promise<DiscordContainerBuilder> {
        const discordContainer = new DiscordContainerBuilder()
            .setAccentColor(container.accent_color || DEFAULT_EMBED_COLOR)
            .setSpoiler(container.spoiler || false);

        if (!container.components) {
            return discordContainer;
        }

        // Process components sequentially but group consecutive buttons
        let i = 0;
        while (i < container.components.length) {
            const component = container.components[i];

            if (!component || !component.type) {
                i++;
                continue;
            }

            if (component.type === ComponentType.BUTTON) {
                const consecutiveButtons: (ActionButton | LinkButton | PremiumButton)[] = [];
                let j = i;

                while (j < container.components.length &&
                    container.components[j]?.type === ComponentType.BUTTON) {
                    consecutiveButtons.push(container.components[j] as ActionButton | LinkButton | PremiumButton);
                    j++;
                }

                // Map all consecutive buttons and group them in one ActionRow
                const buttonPromises = consecutiveButtons.map(btn => this.mapButtonToDiscordButtonAsync(btn));
                const discordButtons = await Promise.all(buttonPromises);
                const buttonActionRow = this.createActionRowWithComponents(discordButtons);
                discordContainer.addActionRowComponents([buttonActionRow]);

                i = j; // Skip processed buttons
            } else {
                // Process other component types individually
                switch (component.type) {
                    case ComponentType.TEXT_DISPLAY:
                    case ComponentType.TITLE:
                    case ComponentType.FOOTER:
                        const textDisplay = await this.mapTextDisplayToDiscordTextDisplayAsync(component as TextDisplay);
                        discordContainer.addTextDisplayComponents([textDisplay]);
                        break;
                    case ComponentType.MEDIA_GALLERY:
                        const mediaGallery = await this.mapMediaGalleryToDiscordMediaGalleryAsync(component as MediaGallery);
                        discordContainer.addMediaGalleryComponents([mediaGallery]);
                        break;
                    case ComponentType.SEPARATOR:
                        const separator = await this.mapSeparatorToDiscordSeparatorAsync(component as Separator);
                        discordContainer.addSeparatorComponents([separator]);
                        break;
                }
                i++;
            }
        }

        return discordContainer;
    }

    // #region Component handling
    public async addComponentAsync(event: InteractionEvent, component: Component): Promise<void> {
        event.components.push(component);
    }

    public async addComponentsAsync(event: InteractionEvent, components: Component[], addInFront?: boolean): Promise<void> {
        if (addInFront)
            event.components.unshift(...components);
        else
            event.components.push(...components);
    }

    public async clearComponentsAsync(event: InteractionEvent): Promise<void> {
        event.components = [];
    }
    // #endregion

    public async buildMessageContentAsync(event: BaseInteractionEvent, components: Component[], message?: MultiLingualString | string, ephemeral?: boolean): Promise<DiscordMessageContent | null> {
        return withEventContextAsync(event, async () => {
            if (message) {
                if (typeof message === 'string')
                    message = createMultiLingualString(message);

                components.push(ComponentService.createContent(message));
            }

            const rootComponents = await this.mapRootComponentsAsync(components);

            if (rootComponents.length === 0) {
                return null;
            }

            const files: AttachmentBuilder[] = await this.collectLocalAttachmentsAsync(components);

            return this.createReplyOptions(rootComponents, files, ephemeral);
        });
    }

    public createReplyOptions(components: any[], files: AttachmentBuilder[], ephemeral?: boolean): DiscordMessageContent {
        return {
            components: components,
            flags: DiscordMessageFlags.IsComponentsV2,
            files: files.length > 0 ? files : undefined,
            ephemeral: ephemeral
        };
    }

    private async collectLocalAttachmentsAsync(components: Component[]): Promise<AttachmentBuilder[]> {
        const items: MediaGallery['items'][number][] = [];

        const collect = (components: Component[]): void => {
            for (const component of components) {
                if (!component || !component.type)
                    continue;

                if (component.type === ComponentType.MEDIA_GALLERY) {
                    const mediaGallery = component as MediaGallery;
                    for (const item of mediaGallery.items) {
                        if (!item.media.url.startsWith('http:') && !item.media.url.startsWith('https:'))
                            items.push(item);
                    }
                } else if (component.type === ComponentType.CONTAINER) {
                    const container = component as Container;
                    if (container.components)
                        collect(container.components);
                }
            }
        };

        collect(components);

        // Read all local files concurrently — each goes through MediaService's buffer cache
        const loaded = await Promise.all(items.map(async (item) => {
            try {
                if (!(await MediaService.fileExistsAsync(item.media.url))) {
                    Logger.logWarning(`File not found: ${item.media.url}`);
                    return null;
                }
                const fileBuffer = await MediaService.getBufferByPathAsync(item.media.url);
                Logger.logDebug(() => `Attachment loaded: ${item.media.name}.${item.media.type} (${fileBuffer.length} bytes)`);
                return new AttachmentBuilder(fileBuffer, { name: `${item.media.name}.${item.media.type}` });
            } catch (error) {
                Logger.logError(`Error loading file: ${item.media.url}`, error as Error);
                return null;
            }
        }));

        return loaded.filter((file): file is AttachmentBuilder => file !== null);
    }

    public mapContentComponents(interaction: InteractionEvent): string {
        const textDisplayComponents = interaction.components.filter(component => component.type === ComponentType.TEXT_DISPLAY) as Content[];
        return textDisplayComponents.map(component => component.content.getMessage()).join('\n');
    }

}

export default new DiscordComponentMapper();