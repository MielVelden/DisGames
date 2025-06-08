export interface Media {
    url: string;
    name: string;
    type: MediaType;
}

export enum MediaType {
    PNG = 'png',
    JPG = 'jpg',
    GIF = 'gif',
    WEBP = 'webp',
}