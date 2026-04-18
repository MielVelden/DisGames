import { DurationEnum, DurationGranularityEnum } from "../../interfaces/application";
import { User } from "../../interfaces/domain";
import { DashboardEnum } from "../../interfaces/enums/view/DashboardEnum";
import { DashboardSectionCardData, DashboardResponse, TimeframeData, TrendDirection } from "../../interfaces/view/Dashboard";
import EventRepository from "../../repositories/EventRepository";
import TimelineRepository from "../../repositories/TimelineRepository";
import UserRepository from "../../repositories/UserRepository";
import { calculateDuration, humanizeDuration } from "../../utils/helpers/Duration";
import { assertNever, ErrorHelper } from "../../utils/application/Error";
import { ChartTypeEnum } from "../../interfaces/enums/application/ChartTypeEnum";
import ChartService from "./ChartService";
import ServerRepository from "../../repositories/ServerRepository";
import ServerService from "../domain/ServerService";
import CacheRegistry from "../../repositories/util/CacheRegistry";
import GameRepository from "../../repositories/GameRepository";
import { GameTypeEnum } from "../../interfaces/enums/database/GameTypeEnum";
import { LanguageEnum } from "../../interfaces/enums/database/LanguageEnum";
import { i18n } from "../../utils/i18n/i18n";
import { ExceptionEnum, MetricEnum } from "../../interfaces/enums";
import MetricService from "../domain/MetricService";
import { humanizeDateFromNow } from "../../utils/helpers/Date";

class DashboardService {
    public async getDashboardAsync(dashboardEnum: DashboardEnum, identity: User): Promise<DashboardResponse> {
        switch (dashboardEnum) {
            case DashboardEnum.HOME:
                return this.getHomeDashboardAsync(identity);
            case DashboardEnum.USERS:
                return this.getUsersDashboardAsync(identity);
            case DashboardEnum.SERVERS:
                return this.getServersDashboardAsync(identity);
            case DashboardEnum.ANALYTICS:
                return this.getAnalyticsDashboardAsync(identity);
            case DashboardEnum.GAMES:
                return this.getGamesDashboardAsync(identity);
            case DashboardEnum.PERFORMANCE:
                return this.getCachePerformanceDashboardAsync();
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
                secondaryText: `Compared to ${humanizeDuration(timeframe.timeFrame, DurationGranularityEnum.HOUR)} ago`
            }
        }
    }

    private async createDashboardCardByMetricAsync(metric: MetricEnum): Promise<DashboardSectionCardData> {
        const model = await MetricService.getLatestByMetricAsync(metric);
        if (!model)
            ErrorHelper.throw(ExceptionEnum.RECORD_NOT_FOUND);

        return {
            id: metric.toString().toLowerCase(),
            metricEnum: metric,
            title: i18n.metrics[metric][LanguageEnum.EN],
            description: i18n.metrics[metric][LanguageEnum.EN],
            value: model.Value,
            trend: undefined,
            footer: {
                primaryText: i18n.metrics[metric][LanguageEnum.EN],
                secondaryText: `Recorded ${humanizeDateFromNow(model.Datetime)}`
            }
        }
    }

    private async getHomeDashboardAsync(identity: User): Promise<DashboardResponse> {
        return {
            title: "Home",
            cards: [
                this.createDashboardCard("Total Revenue", "$1,250.00", "up", { primaryText: "Trending up this month", secondaryText: "Visitors for the last 6 months" }),
                this.createDashboardCard("New Customers", 1234, "down", { primaryText: "Down 20% this period", secondaryText: "Acquisition needs attention" }),
                this.createDashboardCard("Active Accounts", 45678, "up", { primaryText: "Strong user retention", secondaryText: "Engagement exceed targets" }),
                this.createDashboardCard("Growth Rate", "4.5%", "up", { primaryText: "Steady performance", secondaryText: "Meets growth projections" })
            ]
        }
    }

    private async getUsersDashboardAsync(identity: User): Promise<DashboardResponse> {
        const timeFrame = calculateDuration(7, DurationEnum.DAY);
        const usersTimeFrame = await TimelineRepository.getUsersTimeFrameAsync(timeFrame);
        const messagesSentTimeFrame = await EventRepository.getMessagesSentTimeFrameAsync(timeFrame);
        const gamesPlayedTimeFrame = await TimelineRepository.getGamesPlayedTimeFrameAsync(timeFrame);

        // Get the charts
        const lineChart = await ChartService.getChartAsync(ChartTypeEnum.LineChart_User_NewUser, identity);
        const pieChart = await ChartService.getChartAsync(ChartTypeEnum.PieChart_User_DeviceType, identity);

        return {
            title: "Users",
            cards: [
                await this.createDashboardCardByMetricAsync(MetricEnum.Users),
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

    private async getServersDashboardAsync(identity: User): Promise<DashboardResponse> {
        const timeFrame = calculateDuration(7, DurationEnum.DAY);
        const servers = await ServerRepository.getAllAsync();
        const serversTimeFrame = await TimelineRepository.getServersTimeFrameAsync(timeFrame);
        const members = await ServerService.getTotalServerMembersAsync();
        const averageMemberCount =
            servers.length > 0 ? Math.round((members / servers.length) * 10) / 10 : 0;

        // Get the chart
        const lineChart = await ChartService.getChartAsync(ChartTypeEnum.LineChart_Server_NewServer, identity);
        const pieChart = await ChartService.getChartAsync(ChartTypeEnum.PieChart_Server_LanguageDistribution, identity);

        return {
            title: "Servers",
            cards: [
                await this.createDashboardCardByMetricAsync(MetricEnum.Servers),
                this.createDashboardCardWithTimeframe(
                    "New Servers",
                    serversTimeFrame
                ),
                await this.createDashboardCardByMetricAsync(MetricEnum.Members),
                this.createDashboardCard(
                    "Average Member Count",
                    averageMemberCount,
                    undefined,
                    {
                        primaryText: "Mean members per server",
                        secondaryText: "Total members divided by server count"
                    }
                )
            ],
            charts: [
                lineChart,
                pieChart
            ]
        }
    }

    private getCachePerformanceDashboardAsync(): DashboardResponse {
        const stats = CacheRegistry.getAggregateStats();
        const footer = {
            primaryText: `${stats.hits.toLocaleString()} hits / ${stats.totalRequests.toLocaleString()} requests`,
            secondaryText: `${stats.misses.toLocaleString()} misses`
        };

        return {
            title: "Cache Performance",
            cards: [
                this.createDashboardCard(
                    "Cache Hit Rate",
                    `${stats.hitRatePercent}%`,
                    stats.hitRatePercent >= 50 ? "up" : "down",
                    footer
                ),
                this.createDashboardCard(
                    "Total Cache Requests",
                    stats.totalRequests,
                    undefined,
                    {
                        primaryText: `${stats.hits.toLocaleString()} hits`,
                        secondaryText: `${stats.misses.toLocaleString()} misses`
                    }
                )
            ]
        };
    }

    private async getAnalyticsDashboardAsync(identity: User): Promise<DashboardResponse> {
        const timeFrame = calculateDuration(2, DurationEnum.DAY);
        const serversTimeFrame = await TimelineRepository.getServersTimeFrameAsync(timeFrame);

        const barChartEventsByType = await ChartService.getChartAsync(ChartTypeEnum.BarChart_Events_EventsByType, identity);
        const barChartActivityOverTime = await ChartService.getChartAsync(ChartTypeEnum.BarChart_Events_ActivityOverTime, identity);
        const barChartEventsPerHour = await ChartService.getChartAsync(ChartTypeEnum.BarChart_Events_EventsPerHour, identity);

        return {
            title: "Analytics",
            cards: [
                await this.createDashboardCardByMetricAsync(MetricEnum.Servers),
                this.createDashboardCardWithTimeframe(
                    "New Servers",
                    serversTimeFrame
                ),
                await this.createDashboardCardByMetricAsync(MetricEnum.ServerMembers),
                await this.createDashboardCardByMetricAsync(MetricEnum.Events)
            ],
            charts: [
                barChartEventsByType,
                barChartActivityOverTime,
                barChartEventsPerHour
            ]
        }
    }

    private getGameTypeDisplayName(gameType: GameTypeEnum): string {
        const def = i18n.commands.games.types[gameType];
        if (!def?.name)
            return String(gameType);
        return def.name[LanguageEnum.EN];
    }

    private async getGamesDashboardAsync(identity: User): Promise<DashboardResponse> {
        const timeFrame = calculateDuration(2, DurationEnum.DAY);
        const gamesPlayedTimeFrame = await TimelineRepository.getGamesPlayedTimeFrameAsync(timeFrame);
        const barChartGamesByType = await ChartService.getChartAsync(ChartTypeEnum.PieChart_Games_GamesByType, identity);

        const totalGames = await GameRepository.getTotalAsync();
        const distinctServersWithGames = await GameRepository.getDistinctServerCountAsync();
        const averageGamesPerServer =
            distinctServersWithGames > 0
                ? Math.round((totalGames / distinctServersWithGames) * 10) / 10
                : 0;

        const topGameType = await GameRepository.getMostPopularGameTypeAsync();
        const mostPopularGameLabel =
            topGameType !== null ? this.getGameTypeDisplayName(topGameType) : "—";

        return {
            title: "Games",
            cards: [
                this.createDashboardCard(
                    "Average Games per Server",
                    averageGamesPerServer,
                    undefined,
                    {
                        primaryText: "Mean active games",
                        secondaryText: "Per server with at least one configured game"
                    }
                ),
                await this.createDashboardCardByMetricAsync(MetricEnum.ActiveGames),
                this.createDashboardCard(
                    "Most Popular Game",
                    mostPopularGameLabel,
                    undefined,
                    {
                        primaryText: "By number of instances",
                        secondaryText: "Most common game type in the table"
                    }
                ),
                this.createDashboardCardWithTimeframe(
                    "Games Played",
                    gamesPlayedTimeFrame
                )
            ],
            charts: [barChartGamesByType]
        };
    }
}

export default new DashboardService();
