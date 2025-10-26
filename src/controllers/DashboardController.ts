import { Controller } from "../interfaces/application/Controller";
import { User } from "../interfaces/domain";
import { ExceptionEnum } from "../interfaces/enums";
import { DashboardEnum } from "../interfaces/enums/view/DashboardEnum";
import { DashboardView } from "../interfaces/view/Dashboard";
import DashboardService from "../services/application/DashboardService";
import { ErrorHelper } from "../utils/application/Error";

class DashboardController implements Controller {
    async getByIdAsync(id: number, identity: User): Promise<void> {
        ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);
    }

    async getAllAsync(identity: User): Promise<void[]> {
        ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);
    }

    async getDashboardAsync(dashboardEnum: DashboardEnum, identity: User): Promise<DashboardView> {
        return await DashboardService.getDashboardAsync(dashboardEnum, identity);
    }
}

export default DashboardController;