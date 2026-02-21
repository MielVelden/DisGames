import { DurationEnum } from "../../interfaces/application";
import { User } from "../../interfaces/domain";
import { DashboardEnum } from "../../interfaces/enums/view/DashboardEnum";
import { DashboardSectionCardData, DashboardView, TimeframeData, TrendDirection } from "../../interfaces/view/Dashboard";
import EventsRepository from "../../repositories/EventsRepository";
import TimelineRepository from "../../repositories/TimelineRepository";
import UserRepository from "../../repositories/UserRepository";
import { calculateDuration } from "../../utils/helpers/Duration";
import { assertNever } from "../../utils/application/Error";
import { ChartTypeEnum } from "../../interfaces/enums/application/ChartTypeEnum";
import ChartService from "./ChartService";
import ServerRepository from "../../repositories/ServerRepository";
import ServerService from "../domain/ServerService";

class DashboardService {
    public async getDashboardAsync(dashboardEnum: DashboardEnum, identity: User): Promise<DashboardView> {
        switch (dashboardEnum) {
            case DashboardEnum.HOME:
                return this.getHomeDashboardAsync(identity);
            case DashboardEnum.USERS:
                return this.getUsersDashboardAsync(identity);
            case DashboardEnum.SERVERS:
                return this.getServersDashboardAsync(identity);
            case DashboardEnum.ANALYTICS:
                return this.getAnalyticsDashboardAsync(identity);
            default:
                assertNever(dashboardEnum, DashboardEnum)
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

    private createDashboardCardWithTimeframe(title: string, timeframe: TimeframeData): DashboardSectionCardData {
        return {
            id: title.toLowerCase().replace(/ /g, "_"),
            title,
            description: title,
            value: timeframe.currentValue,
            trend: timeframe.currentValue > timeframe.previousValue ? {
                direction: "up",
                percentage: (timeframe.currentValue - timeframe.previousValue) / timeframe.previousValue * 100,
                label: "Trending up"
            } : {
                direction: "down",
                percentage: (timeframe.previousValue - timeframe.currentValue) / timeframe.previousValue * 100,
                label: "Trending down"
            },
            footer: {
                primaryText: timeframe.currentValue > timeframe.previousValue ? "Trending up" : "Trending down",
                secondaryText: `From ${timeframe.timeFrame.toString()} ago`
            }
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
        const usersTimeFrame = await TimelineRepository.getUsersTimeFrameAsync(timeFrame);
        const messagesSentTimeFrame = await EventsRepository.getMessagesSentTimeFrameAsync(timeFrame);
        const gamesPlayedTimeFrame = await TimelineRepository.getGamesPlayedTimeFrameAsync(timeFrame);
        const averageGamesPlayedPerUser = gamesPlayedTimeFrame.currentValue / users;

        // Get the charts
        const lineChart = await ChartService.getChartAsync(ChartTypeEnum.LineChart_User_NewUser, identity);
        const pieChart = await ChartService.getChartAsync(ChartTypeEnum.PieChart_User_DeviceType, identity);
        
        return {
            cards: [
                this.createDashboardCard(
                    "Total Users",
                    users,
                    "up",
                    {
                        primaryText: "User base is growing",
                        secondaryText: "Consistent increase in registrations"
                    }
                ),
                this.createDashboardCardWithTimeframe(
                    "New Users",
                    usersTimeFrame
                ),
                this.createDashboardCardWithTimeframe(
                    "Total Messages",
                    messagesSentTimeFrame
                ),
                this.createDashboardCardWithTimeframe(
                    "Games Played",
                    gamesPlayedTimeFrame,
                )
            ],
            charts: [lineChart, pieChart]
        }
    }

    private async getServersDashboardAsync(identity: User): Promise<DashboardView> {
        const timeFrame = calculateDuration(7, DurationEnum.DAY);
        const servers = await ServerRepository.getAllAsync();
        const serversTimeFrame = await TimelineRepository.getServersTimeFrameAsync(timeFrame);
        const members = await ServerService.getTotalMembersAsync();

        // Get the chart
        const lineChart = await ChartService.getChartAsync(ChartTypeEnum.LineChart_Server_NewServer, identity);

        return {
            cards: [
                this.createDashboardCard(
                    "Total Servers",
                    servers.length,
                    "up",
                    {
                        primaryText: "Server base is growing",
                        secondaryText: "Consistent increase in servers"
                    }
                ),
                this.createDashboardCardWithTimeframe(
                    "New Servers",
                    serversTimeFrame
                ),
                this.createDashboardCard(
                    "Total Members",
                    members,
                    "up",
                    {
                        primaryText: "Member base is growing",
                        secondaryText: "Consistent increase in members"
                    }
                )
            ],
            charts: [
                lineChart
            ]
        }
    }

    private async getAnalyticsDashboardAsync(identity: User): Promise<DashboardView> {
        const timeFrame = calculateDuration(7, DurationEnum.DAY);
        const servers = await ServerRepository.getAllAsync();
        const serversTimeFrame = await TimelineRepository.getServersTimeFrameAsync(timeFrame);
        const members = await ServerService.getTotalMembersAsync();

        const barChartEventsByType = await ChartService.getChartAsync(ChartTypeEnum.BarChart_Events_EventsByType, identity);
        const barChartActivityOverTime = await ChartService.getChartAsync(ChartTypeEnum.BarChart_Events_ActivityOverTime, identity);
        const barChartEventsPerHour = await ChartService.getChartAsync(ChartTypeEnum.BarChart_Events_EventsPerHour, identity);

        return {
            cards: [
                this.createDashboardCard(
                    "Total Servers",
                    servers.length,
                    "up",
                    {
                        primaryText: "Server base is growing",
                        secondaryText: "Consistent increase in servers"
                    }
                ),
                this.createDashboardCardWithTimeframe(
                    "New Servers2",
                    serversTimeFrame
                ),
                this.createDashboardCard(
                    "Total Members",
                    members,
                    "up",
                    {
                        primaryText: "Member base is growing",
                        secondaryText: "Consistent increase in members"
                    }
                )
            ],
            charts: [
                barChartEventsByType,
                barChartActivityOverTime,
                barChartEventsPerHour
            ]
        }
    }
}

export default new DashboardService();
