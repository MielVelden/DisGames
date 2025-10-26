export interface EmbedField {
    name: string;
    value: string;
    inline?: boolean;
}

export interface EmbedFooter {
    text: string;
    icon_url?: string;
}

export interface EmbedConfig {
    title?: string;
    description?: string;
    color?: number;
    timestamp?: string;
    footer?: EmbedFooter;
    fields?: EmbedField[];
}