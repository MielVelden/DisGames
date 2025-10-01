import { Controller } from "../interfaces/application/Controller";
import { User } from "../interfaces/domain";
import { DashboardEnum } from "../interfaces/enums/view/DashboardEnum";
import { DashboardView } from "../interfaces/view/Dashboard";

class DashboardController implements Controller {
    async getByIdAsync(id: number, identity: User): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async getAllAsync(identity: User): Promise<void[]> {
        throw new Error("Method not implemented.");
    }

    async getDashboardAsync(dashboardEnum: DashboardEnum, identity: User): Promise<DashboardView> {
        return {
            cards: [
                {
                    id: "revenue",
                    title: "Total Revenue",
                    description: "Total Revenue",
                    value: "$1,250.00",
                    trend: {
                        direction: "up",
                        percentage: 12.5,
                        label: "Trending up this month"
                    },
                    footer: {
                        primaryText: "Trending up this month",
                        secondaryText: "Visitors for the last 6 months"
                    }
                },
                {
                    id: "customers",
                    title: "New Customers",
                    description: "New Customers",
                    value: 1234,
                    trend: {
                        direction: "down",
                        percentage: -20,
                        label: "Down 20% this period"
                    },
                    footer: {
                        primaryText: "Down 20% this period",
                        secondaryText: "Acquisition needs attention"
                    }
                },
                {
                    id: "accounts",
                    title: "Active Accounts",
                    description: "Active Accounts",
                    value: 45678,
                    trend: {
                        direction: "up",
                        percentage: 12.5,
                        label: "Strong user retention"
                    },
                    footer: {
                        primaryText: "Strong user retention",
                        secondaryText: "Engagement exceed targets"
                    }
                },
                {
                    id: "growth",
                    title: "Growth Rate",
                    description: "Growth Rate",
                    value: "4.5%",
                    trend: {
                        direction: "up",
                        percentage: 4.5,
                        label: "Steady performance"
                    },
                    footer: {
                        primaryText: "Steady performance",
                        secondaryText: "Meets growth projections"
                    }
                }
            ]
        }
    }
}

export default DashboardController;