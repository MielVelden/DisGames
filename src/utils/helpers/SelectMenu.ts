import { ComponentType, SelectMenu } from "../../interfaces/application/Message";

export function isSelectMenuEmpty(selectMenu: SelectMenu): boolean {
    switch(selectMenu.type) {
        case ComponentType.STRING_SELECT:
            return selectMenu.options.length === 0;
        default:
            return false;
    }
}