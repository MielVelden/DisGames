import { Controller } from "../interfaces/application/Controller";
import { User } from "../interfaces/domain";
import { DashboardEnum } from "../interfaces/enums/view/DashboardEnum";
import { DashboardView } from "../interfaces/view/Dashboard";
import DashboardService from "../services/application/DashboardService";

class DashboardController implements Controller {
    async getByIdAsync(id: number, identity: User): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async getAllAsync(identity: User): Promise<void[]> {
        throw new Error("Method not implemented.");
    }

    async getDashboardAsync(dashboardEnum: DashboardEnum, identity: User): Promise<DashboardView> {
        return await DashboardService.getDashboardAsync(dashboardEnum, identity);
    }
}

export default DashboardController;