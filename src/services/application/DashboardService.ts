import { DurationEnum } from "../../interfaces/application";
import { User } from "../../interfaces/domain";
import { DashboardEnum } from "../../interfaces/enums/view/DashboardEnum";
import { DashboardSectionCardData, DashboardView, TrendDirection } from "../../interfaces/view/Dashboard";
import EventsRepository from "../../repositories/EventsRepository";
import TimelineRepository from "../../repositories/TimelineRepository";
import UserRepository from "../../repositories/UserRepository";
import { calculateDuration } from "../../utils/Duration";
import { assertNever } from "../../utils/Error";

class DashboardService {
    public async getDashboardAsync(dashboardEnum: DashboardEnum, identity: User): Promise<DashboardView> {
        switch (dashboardEnum) {
            case DashboardEnum.HOME:
                return this.getHomeDashboardAsync(identity);
            case DashboardEnum.USERS:
                return this.getUsersDashboardAsync(identity);
            default:
                assertNever(dashboardEnum, DashboardEnum)
        }

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

    private createDashboardCard(title: string, value: string | number, trend: TrendDirection | undefined, footer: { primaryText: string, secondaryText: string }): DashboardSectionCardData {
        return {
            id: title.toLowerCase().replace(/ /g, "_"),
            title,
            description: title,
            value,
            trend: trend ? {
                direction: trend,
                percentage: 0,
                label: ""
            } : undefined,
            footer
        }
    }

    private async getHomeDashboardAsync(identity: User): Promise<DashboardView> {
        return {
            cards: [
                this.createDashboardCard("Total Revenue", "$1,250.00", "up", { primaryText: "Trending up this month", secondaryText: "Visitors for the last 6 months" }),
                this.createDashboardCard("New Customers", 1234, "down", { primaryText: "Down 20% this period", secondaryText: "Acquisition needs attention" }),
                this.createDashboardCard("Active Accounts", 45678, "up", { primaryText: "Strong user retention", secondaryText: "Engagement exceed targets" }),
                this.createDashboardCard("Growth Rate", "4.5%", "up", { primaryText: "Steady performance", secondaryText: "Meets growth projections" })
            ]
        }
    }

    private async getUsersDashboardAsync(identity: User): Promise<DashboardView> {
        const timeFrame = calculateDuration(7, DurationEnum.DAY);
        const users = await UserRepository.getTotalUsersAsync();
        const newUsers = await TimelineRepository.getTotalUsersCreatedAsync(timeFrame);
        const getTotalMessagesSent = await EventsRepository.getTotalMessagesSentAsync(timeFrame);
        const gamesPlayed = await TimelineRepository.getGamesPlayedAsync(timeFrame);
        const averageGamesPlayedPerUser = gamesPlayed / users;

        return {
            cards: [
                this.createDashboardCard(
                    "Total Users",
                    newUsers,
                    "up",
                    {
                        primaryText: "User base is growing",
                        secondaryText: "Consistent increase in registrations"
                    }
                ),
                this.createDashboardCard(
                    "Total Messages",
                    getTotalMessagesSent,
                    "up",
                    {
                        primaryText: "High engagement",
                        secondaryText: "Users are actively communicating"
                    }
                ),
                this.createDashboardCard(
                    "Games Played",
                    gamesPlayed,
                    "up",
                    {
                        primaryText: "Gaming activity is strong",
                        secondaryText: "Users enjoy playing together"
                    }
                ),
                this.createDashboardCard(
                    "Avg. Games per User",
                    averageGamesPlayedPerUser,
                    "up",
                    {
                        primaryText: "Active participation",
                        secondaryText: "Users play on average multiple games"
                    }
                )
            ]
        }
    }

}

export default new DashboardService();
