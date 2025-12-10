export enum EventTypeEnum {
    SLASH_COMMAND = 1,
    BUTTON = 2,
    SELECT_MENU = 3,
    MODAL_SUBMIT = 4,
    MESSAGE = 5,
    MESSAGE_UPDATE = 6,
    MESSAGE_DELETE = 7,
}

export function isMessageEventType(eventType: EventTypeEnum): eventType is EventTypeEnum.MESSAGE | EventTypeEnum.MESSAGE_UPDATE | EventTypeEnum.MESSAGE_DELETE {
    return eventType === EventTypeEnum.MESSAGE || eventType === EventTypeEnum.MESSAGE_UPDATE || eventType === EventTypeEnum.MESSAGE_DELETE;
}