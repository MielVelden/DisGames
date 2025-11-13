import { InteractionEvent } from "../../interfaces/application";
import { PointsModel, PointsModelFieldEnum, PointsSaveModel } from "../../interfaces/database/TableInterfaces";
import { ExceptionEnum } from "../../interfaces/enums";
import PointRepository from "../../repositories/PointRepository";
import { ErrorHelper } from "../../utils/application/Error";
import { BaseDomainService } from "./BaseDomainService";

class PointService extends BaseDomainService<PointsModel, PointsSaveModel, typeof PointRepository> {
    protected readonly repository = PointRepository;

    public getAllAsync(): Promise<PointsModel[]> {
        return this.repository.getAllAsync();
    }

    protected async performSaveAsync(savable: PointsSaveModel, event: InteractionEvent): Promise<PointsModel> {
        if (savable.isUpdate()) {
            // Update the record
            const entity = await this.repository.getByIdAsync(savable.getId()!);
            if (!entity)
                ErrorHelper.throw(ExceptionEnum.RECORD_NOT_FOUND);

            savable.validateIsNotNull(PointsModelFieldEnum.Points);
            savable.validateHasNotChanged(PointsModelFieldEnum.UserId, entity.UserId);
            savable.validateHasNotChanged(PointsModelFieldEnum.ServerId, entity.ServerId);
            savable.validateHasNotChanged(PointsModelFieldEnum.GameId, entity.GameId);

            entity.Points += savable.Points!;
            return await this.repository.saveAsync(entity);
        } else {
            savable.validateIsNotNull(PointsModelFieldEnum.UserId);
            savable.validateIsNotNull(PointsModelFieldEnum.ServerId);
            savable.validateIsNotNull(PointsModelFieldEnum.GameId);
            savable.validateIsNotNull(PointsModelFieldEnum.Points);

            // Check if the record already exists
            const entity = await this.repository.getPointsByUserServerGameIdAsync(savable.UserId!, savable.ServerId!, savable.GameId!);
            if (entity) {
                entity.Points += savable.Points!;
                return await this.repository.saveAsync(entity);
            }

            // Create new record
            return await this.repository.saveAsync(new PointsSaveModel({
                UserId: savable.UserId,
                ServerId: savable.ServerId,
                Points: savable.Points,
                GameId: savable.GameId,
            }));
        }
    }

    public purgeAsync(id: number): Promise<void> {
        return this.repository.purgeAsync(id);
    }
}

export default new PointService();