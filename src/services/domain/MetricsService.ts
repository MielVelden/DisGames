import { MetricsModel, MetricsSaveModel, PointsModel } from "../../interfaces/database/TableInterfaces";
import { MetricsInfo, User } from "../../interfaces/domain";
import { ExceptionEnum } from "../../interfaces/enums";
import { DashboardEnum } from "../../interfaces/enums/view/DashboardEnum";
import MetricsRepository from "../../repositories/MetricsRepository";
import { ErrorHelper } from "../../utils/ErrorHelper";
import DashboardService from "../application/DashboardService";

class MetricsService {
    public async saveAsync(savable: MetricsSaveModel): Promise<MetricsModel> {
        if (!savable.Date)
            throw ErrorHelper.throwError(ExceptionEnum.RECORD_NOT_FOUND);

        const metrics = await MetricsRepository.getByDateAsync(savable.Date);
        if (metrics)
            throw ErrorHelper.throwError(ExceptionEnum.RECORD_ALREADY_EXISTS);

        return await MetricsRepository.saveAsync(savable);
    }
}

export default new MetricsService();