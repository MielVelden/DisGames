import { Service } from "../../interfaces/application/Service";
import { ServersModel } from "../../interfaces/database/TableInterfaces";
import { StyleSlotEnum } from "../../interfaces/enums/application/StyleSlotEnum";
import { ResolvedStyle, StylePresetConfig, StylePresetModule, StyleSourceEnum, StyleWindow } from "../../interfaces/domain/StylePreset";
import Logger from "../../utils/application/Logger";
import * as path from "path";
import { collectModules } from "../../utils/collectors/ModuleCollector";
import { getCurrentServer } from "../../middleware/EventContext";
import { isWithinMonthDayRange } from "../../utils/helpers/Date";
import OverrideService from "../application/OverrideService";
import { OverrideKeyEnum } from "../../interfaces/enums/application/OverrideKeyEnum";
import { registerService } from "../../utils/container/Container";

const NO_STYLE: ResolvedStyle = { presetId: null, source: null, theme: {} };

export class StyleService extends Service {
    private presets: StylePresetConfig[] = [];

    public async initAsync(): Promise<void> {
        const modules = collectModules<StylePresetModule>({
            directoryPath: path.join(__dirname, '..', 'styles'),
            label: 'style preset',
            isValid: (preset): preset is StylePresetModule => !!preset?.config?.id && !!preset.config.theme,
            onInvalid: file => Logger.logWarning(`Style preset ${file} has no valid default export; skipped`),
        });
        this.presets.push(...modules.map(preset => preset.config));
    }

    public getPresets(): StylePresetConfig[] {
        return this.presets;
    }

    public resolve(server: ServersModel | undefined, now: Date = new Date()): ResolvedStyle {
        if (!server)
            return NO_STYLE;

        const forced = this.presets.find(p => p.id === OverrideService.get(OverrideKeyEnum.STYLE));
        if (forced)
            return { presetId: forced.id, source: StyleSourceEnum.OVERRIDE, theme: forced.theme };

        const active = this.presets
            .filter(p => !p.languages?.length || p.languages.includes(server.LanguageEnum))
            .filter(p => p.windows?.some(w => this.isWithinWindow(w, now)))
            .sort((a, b) => b.priority - a.priority)[0];

        if (!active) 
            return NO_STYLE;
        
        return { presetId: active.id, source: StyleSourceEnum.SEASONAL, theme: active.theme };
    }

    public resolveCurrent(now: Date = new Date()): ResolvedStyle {
        return this.resolve(getCurrentServer(), now);
    }

    // Returns the preset emoji for a slot, or `fallback` when no style overrides it.
    public emoji(slot: StyleSlotEnum, fallback: string, server?: ServersModel): string {
        const style = server ? this.resolve(server) : this.resolveCurrent();
        return style.theme.emojis?.[slot] ?? fallback;
    }

    private isWithinWindow(window: StyleWindow, now: Date): boolean {
        return isWithinMonthDayRange(now, window.from, window.to);
    }
}

const styleService = new StyleService();
registerService(styleService);
export default styleService;
