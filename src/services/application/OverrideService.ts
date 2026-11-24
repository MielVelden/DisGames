import { Service } from "../../interfaces/application/Service";
import { OverrideKeyEnum } from "../../interfaces/enums/application/OverrideKeyEnum";
import { registerService } from "../../utils/container/Container";

// Process-lifetime store for forced values, scoped per server (ServersModel.Id).
// Deliberately memory only: a restart always falls back to normal behaviour, and
// each instance holds its own copy.
export class OverrideService extends Service {
    private readonly values = new Map<OverrideKeyEnum, Map<number, string>>();

    public async initAsync(): Promise<void> {
        // Nothing to load: overrides only ever live in memory.
    }

    public get(key: OverrideKeyEnum, serverId: number): string | undefined {
        return this.values.get(key)?.get(serverId);
    }

    public set(key: OverrideKeyEnum, serverId: number, value: string): void {
        const perServer = this.values.get(key) ?? new Map<number, string>();
        perServer.set(serverId, value);
        this.values.set(key, perServer);
    }

    public clear(key: OverrideKeyEnum, serverId: number): void {
        this.values.get(key)?.delete(serverId);
    }
}

const overrideService = new OverrideService();
registerService(overrideService);
export default overrideService;
