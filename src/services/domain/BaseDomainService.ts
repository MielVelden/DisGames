import 'reflect-metadata';
import { TimelineEvent } from "../../interfaces/application/Event";
import { ExceptionEnum, TableEnum } from "../../interfaces/enums";
import { ErrorHelper } from "../../utils/application/Error";
import { Repository, RepositoryWithBase } from "../../interfaces/database/Repository";
import { getEnumProperty } from "../../utils/helpers/EnumMetadata";
import { MetadataKeyEnum } from "../../interfaces/enums/application/MetadataKeyEnum";
import { BaseEntity } from "../../interfaces/database/BaseEntity";
import { registerPull } from "../../utils/registries/MetricRegistry";
import { METRIC_PULL_KEY } from '../../interfaces/domain';
import { Service } from "../../interfaces/application/Service";

export abstract class BaseDomainService<T extends BaseEntity & { getId(): number | undefined; getExternalId(): string | number | undefined; }, S extends BaseEntity, R extends Repository<T> = Repository<T>> extends Service {
    protected abstract readonly repository: R;

    constructor() {
        super();
        const proto = Object.getPrototypeOf(this);
        for (const key of Object.getOwnPropertyNames(proto)) {
            const metric = Reflect.getMetadata(METRIC_PULL_KEY, proto, key);
            if (metric !== undefined)
                registerPull(metric, () => (this as any)[key]());
        }
    }

    public async getByIdAsync(id: number): Promise<T> {
        const entity = await this.repository.getByIdAsync(id);
        if (!entity)
            ErrorHelper.throw(ExceptionEnum.RECORD_NOT_FOUND);
        return entity;
    }

    public async getByExternalIdAsync(externalId: string | number): Promise<T> {
        if (!this.hasBaseRepository(this.repository))
            ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);

        const fieldEnum = this.repository.baseRepository.getFieldEnum();
        if (!fieldEnum)
            ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);

        const externalIdField = getEnumProperty(TableEnum, this.repository.baseRepository.tableEnum, MetadataKeyEnum.ExternalIdField);
        if (!externalIdField)
            ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);

        const fieldName = String(externalIdField) as keyof T;
        const whereCondition = { [fieldName]: externalId } as Partial<Record<keyof T, T[keyof T]>>;
        const results = await this.repository.baseRepository.Select().Where(whereCondition).Limit(1).Execute();
        if (!results || results.length === 0)
            ErrorHelper.throw(ExceptionEnum.RECORD_NOT_FOUND);
        return results[0];
    }

    private hasBaseRepository(repo: Repository<T>): repo is RepositoryWithBase<T, S> {
        return 'baseRepository' in repo && repo.baseRepository !== undefined;
    }

    public abstract getAllAsync(): Promise<T[]>;

    protected abstract performSaveAsync(savable: S, event: TimelineEvent): Promise<T>;

    public async saveAsync(savable: S, event: TimelineEvent): Promise<T> {
        ErrorHelper.throwIfNull(savable, ExceptionEnum.INVALID_ARGUMENT);
        ErrorHelper.throwIfNull(event, ExceptionEnum.INVALID_ARGUMENT);

        const result = await this.performSaveAsync(savable, event);
        await event.commitTimelineAsync();

        return result;
    }

    public abstract purgeAsync(id: number): Promise<void>;
}