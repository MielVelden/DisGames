import { Service } from "../../interfaces/application/Service";
import { OverrideKeyEnum } from "../../interfaces/enums/application/OverrideKeyEnum";
import { registerService } from "../../utils/container/Container";

// Process-lifetime store for forced values. Deliberately memory only: a restart
// always falls back to normal behaviour, and each instance holds its own copy.
export class OverrideService extends Service {
    private readonly values = new Map<OverrideKeyEnum, string>();

    public async initAsync(): Promise<void> {
        // Nothing to load: overrides only ever live in memory.
    }

    public get(key: OverrideKeyEnum): string | undefined {
        return this.values.get(key);
    }

    public set(key: OverrideKeyEnum, value: string): void {
        this.values.set(key, value);
    }

    public clear(key: OverrideKeyEnum): void {
        this.values.delete(key);
    }
}

const overrideService = new OverrideService();
registerService(overrideService);
export default overrideService;
