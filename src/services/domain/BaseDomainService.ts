import { InteractionEvent } from "../../interfaces/application";
import { ExceptionEnum } from "../../interfaces/enums";
import { ErrorHelper } from "../../utils/application/Error";

export abstract class BaseDomainService<T, S> {
    public abstract getByIdAsync(id: number): Promise<T>;
    public abstract getAllAsync(): Promise<T[]>;

    protected abstract performSaveAsync(savable: S, event: InteractionEvent): Promise<T>;

    protected async beforeSaveAsync?(savable: S, event: InteractionEvent): Promise<void> {
    }

    protected async afterSaveAsync?(result: T, event: InteractionEvent): Promise<void> {
    }

    public async saveAsync(savable: S, event: InteractionEvent): Promise<T> {
        ErrorHelper.throwIfNull(savable, ExceptionEnum.INVALID_ARGUMENT);
        ErrorHelper.throwIfNull(event, ExceptionEnum.INVALID_ARGUMENT);

        if (this.beforeSaveAsync)
            await this.beforeSaveAsync(savable, event);

        const result = await this.performSaveAsync(savable, event);

        if (this.afterSaveAsync)
            await this.afterSaveAsync(result, event);

        await event.commitTimelineAsync();

        return result;
    }

    public abstract purgeAsync(id: number): Promise<void>;
}