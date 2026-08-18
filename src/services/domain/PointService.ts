import { InteractionEvent } from "../../interfaces/application";
import { PointsModel, PointsModelFieldEnum, PointsSaveModel } from "../../interfaces/database/TableInterfaces";
import { ExceptionEnum } from "../../interfaces/enums";
import PointRepository from "../../repositories/PointRepository";
import { ErrorHelper } from "../../utils/application/Error";
import { BaseDomainService } from "./BaseDomainService";
import Logger from "../../utils/application/Logger";
import { TrackMetricPull } from "../../utils/helpers/Decorator";
import { MetricEnum } from "../../interfaces/enums/application/MetricEnum";
import { registerService } from "../../utils/container/Container";

export class PointService extends BaseDomainService<PointsModel, PointsSaveModel, typeof PointRepository> {
    protected readonly repository = PointRepository;

    public async initAsync(): Promise<void> {}

    public getAllAsync(): Promise<PointsModel[]> {
        return this.repository.getAllAsync();
    }

    protected async performSaveAsync(savable: PointsSaveModel, _event: InteractionEvent): Promise<PointsModel> {
        if (savable.isUpdate()) {
            const entity = await this.repository.getByIdAsync(savable.getId()!);
            if (!entity)
                ErrorHelper.throw(ExceptionEnum.RECORD_NOT_FOUND);

            savable.validateIsNotNull(PointsModelFieldEnum.Points);
            savable.validateHasNotChanged(PointsModelFieldEnum.UserId, entity.UserId);
            savable.validateHasNotChanged(PointsModelFieldEnum.ServerId, entity.ServerId);
            savable.validateHasNotChanged(PointsModelFieldEnum.GameId, entity.GameId);

            entity.Points += savable.Points!;
            const updated = await this.repository.saveAsync(entity);
            Logger.logDebug(`Updated points for user ${updated.UserId} on server ${updated.ServerId} in game ${updated.GameId}: delta ${savable.Points}, total ${updated.Points}`);
            return updated;
        } else {
            savable.validateIsNotNull(PointsModelFieldEnum.UserId);
            savable.validateIsNotNull(PointsModelFieldEnum.ServerId);
            savable.validateIsNotNull(PointsModelFieldEnum.GameId);
            savable.validateIsNotNull(PointsModelFieldEnum.Points);

            const entity = await this.repository.getPointsByUserServerGameIdAsync(savable.UserId!, savable.ServerId!, savable.GameId!);
            if (entity) {
                entity.Points += savable.Points!;
                const updated = await this.repository.saveAsync(entity);
                Logger.logDebug(`Updated points for user ${updated.UserId} on server ${updated.ServerId} in game ${updated.GameId}: delta ${savable.Points}, total ${updated.Points}`);
                return updated;
            }

            const created = await this.repository.saveAsync(new PointsSaveModel({
                UserId: savable.UserId,
                ServerId: savable.ServerId,
                Points: savable.Points,
                GameId: savable.GameId,
            }));
            Logger.logDebug(`Created points record for user ${created.UserId} on server ${created.ServerId} in game ${created.GameId}: points ${created.Points}`);
            return created;
        }
    }

    public async purgeAsync(id: number): Promise<void> {
        await this.repository.purgeAsync(id);
        Logger.logDebug(`Purged points record with id ${id}`);
    }

    @TrackMetricPull(MetricEnum.Points)
    public async getPointsAsync() {
        return this.repository.getTotalPointsAsync();
    }
}

const pointService = new PointService();
registerService(pointService);
export default pointService;