import path from "path";
import fs from "fs";
import { PersistentButton } from "../../interfaces/application/PersistentButton";
import { PersistentButtonEnum } from "../../interfaces/enums/application/ButtonId";
import Logger from "../application/Logger";
import { resolvePath } from "../helpers/PathResolver";

const buttonsPath = resolvePath('buttons', 'persistent');
const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

const registry: Map<PersistentButtonEnum, PersistentButton> = new Map();

export function loadPersistentButtons(): void {
    for (const file of buttonFiles) {
        const filePath = path.join(buttonsPath, file);
        const button: PersistentButton = require(filePath).default;

        registry.set(button.id, button);
        Logger.logInfo(`Persistent button loaded: ${button.id}`);
    }
}

export function getPersistentButton(id: PersistentButtonEnum): PersistentButton | undefined {
    return registry.get(id);
}
