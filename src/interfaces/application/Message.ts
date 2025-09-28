import { MultiLingualString } from "./MultiLangualString";
import { Media } from "./Media";

export interface MessageContainer {
    components: Component[];
}

export interface Component {
    id?: string;
    type: ComponentType;
}

export enum ComponentType {
    ACTION_ROW = 'ACTION_ROW',
    BUTTON = 'BUTTON',
    STRING_SELECT = 'STRING_SELECT',
    TEXT_INPUT = 'TEXT_INPUT',
    USER_SELECT = 'USER_SELECT',
    ROLE_SELECT = 'ROLE_SELECT',
    MENTIONABLE_SELECT = 'MENTIONABLE_SELECT',
    CHANNEL_SELECT = 'CHANNEL_SELECT',
    SECTION = 'SECTION',
    TEXT_DISPLAY = 'TEXT_DISPLAY',
    THUMBNAIL = 'THUMBNAIL',
    MEDIA_GALLERY = 'MEDIA_GALLERY',
    FILE = 'FILE',
    SEPARATOR = 'SEPARATOR',
    CONTAINER = 'CONTAINER',
    CONTENT = 'CONTENT',
    TITLE = 'TITLE',
    FOOTER = 'FOOTER'
}

export interface Content extends Component {
    type: ComponentType.CONTENT;
    content: MultiLingualString;
}

export interface Title extends Component {
    type: ComponentType.TITLE;
    content: MultiLingualString;
}

export interface Footer extends Component {
    type: ComponentType.FOOTER;
    content: MultiLingualString;
}

// #region Action Row

export interface ActionRow extends Component {
    type: ComponentType.ACTION_ROW;
    components: Component[];
}

// #endregion

// #region Button

export enum ButtonStyle {
    PRIMARY = 1,
    SECONDARY = 2,
    SUCCESS = 3,
    DANGER = 4,
    LINK = 5,
    PREMIUM = 6
}

export interface BaseButton extends Component {
    type: ComponentType.BUTTON;
    style: ButtonStyle;
    label?: MultiLingualString;
    emoji?: {
        name?: string;
        id?: string;
        animated?: boolean;
    } | string;
    disabled?: boolean;
}

export interface ActionButton extends BaseButton {
    style: ButtonStyle.PRIMARY | ButtonStyle.SECONDARY | ButtonStyle.SUCCESS | ButtonStyle.DANGER;
    custom_id: string;
}

export interface LinkButton extends BaseButton {
    style: ButtonStyle.LINK;
    url: string;
}

export interface PremiumButton extends BaseButton {
    style: ButtonStyle.PREMIUM;
    sku_id: string;
}

// #endregion

// #region Select Menus
export type SelectMenu = StringSelect | UserSelect | RoleSelect | MentionableSelect | ChannelSelect;

export interface BaseSelectMenu extends Component {
    custom_id: string;
    question?: MultiLingualString;
    placeholder?: MultiLingualString;
    min_values?: number;
    max_values?: number;
    disabled?: boolean;
}

export interface SelectOption {
    label: MultiLingualString;
    value: string;
    description?: MultiLingualString;
    emoji?: string;
    default?: boolean;
}

export interface StringSelect extends BaseSelectMenu {
    type: ComponentType.STRING_SELECT;
    options: SelectOption[];
}

export interface SelectDefaultValue {
    id: string;
    type: 'user' | 'role' | 'channel';
}

export interface UserSelect extends BaseSelectMenu {
    type: ComponentType.USER_SELECT;
    default_values?: SelectDefaultValue[];
}

export interface RoleSelect extends BaseSelectMenu {
    type: ComponentType.ROLE_SELECT;
    default_values?: SelectDefaultValue[];
}

export interface MentionableSelect extends BaseSelectMenu {
    type: ComponentType.MENTIONABLE_SELECT;
    default_values?: SelectDefaultValue[];
}

export interface ChannelSelect extends BaseSelectMenu {
    type: ComponentType.CHANNEL_SELECT;
    channel_types?: number[];
    default_values?: SelectDefaultValue[];
}

// #endregion

// #region Text Input

export enum TextInputStyle {
    SHORT = 1,
    PARAGRAPH = 2
}

export interface TextInput extends Component {
    type: ComponentType.TEXT_INPUT;
    custom_id: string;
    style: TextInputStyle;
    label: string;
    min_length?: number;
    max_length?: number;
    required?: boolean;
    value?: string;
    placeholder?: string;
}

// #endregion

// #region Section & Text Display

export interface Section extends Component {
    type: ComponentType.SECTION;
    components: TextDisplay[];
    accessory: Thumbnail | BaseButton;
}

export interface TextDisplay extends Component {
    type: ComponentType.TEXT_DISPLAY;
    content: MultiLingualString;
}

// #endregion

// #region Media Components

export interface Thumbnail extends Component {
    type: ComponentType.THUMBNAIL;
    media: Media;
    description?: string;
    spoiler?: boolean;
}

export interface MediaGalleryItem {
    media: Media;
    description?: MultiLingualString;
    spoiler?: boolean;
}

export interface MediaGallery extends Component {
    type: ComponentType.MEDIA_GALLERY;
    items: MediaGalleryItem[];
}

export interface File extends Component {
    type: ComponentType.FILE;
    file: Media;
    spoiler?: boolean;
}

// #endregion

// #region Layout Components

export interface Separator extends Component {
    type: ComponentType.SEPARATOR;
    divider?: boolean;
    spacing?: 1 | 2;
}

export interface Container extends Component {
    type: ComponentType.CONTAINER;
    title?: MultiLingualString;
    footer?: MultiLingualString;
    components: (ActionRow | TextDisplay | Section | MediaGallery | Separator | File | ActionButton | Title | Footer)[];
    accent_color?: number;
    spoiler?: boolean;
}

export interface ContainerBuilder {
    title?: MultiLingualString;
    description: MultiLingualString;
    footer?: MultiLingualString;
}

// #endregion
