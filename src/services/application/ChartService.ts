import { User } from "../../interfaces/domain";
import { ChartEnum, ChartTypeEnum } from "../../interfaces/enums/application/ChartTypeEnum";
import { ChartDefinition } from "../../interfaces/application/Chart";
import { assertNever, ErrorHelper } from "../../utils/application/Error";
import { RepositoryUtils } from "../../repositories/BaseRepository";
import { ExceptionEnum, StoredProcedureEnum } from "../../interfaces/enums";
import { i18n } from "../../utils/i18n/i18n";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { Service } from "../../interfaces/application/Service";
import { registerService } from "../../utils/container/Container";

export class ChartService extends Service {
    public async initAsync(): Promise<void> {}

    public async getChartAsync(chartEnum: ChartTypeEnum, identity: User): Promise<ChartDefinition> {
        switch (chartEnum) {
            case ChartTypeEnum.LineChart_User_NewUser:
                return this.getLineChartUserNewUserAsync(identity);
            case ChartTypeEnum.LineChart_Server_NewServer:
                return this.getLineChartServerNewServerAsync(identity);
            case ChartTypeEnum.BarChart_Events_EventsByType:
                return this.getBarChartEventsEventsByTypeAsync(identity);
            case ChartTypeEnum.BarChart_Events_ActivityOverTime:
                return this.getBarChartEventsActivityOverTimeAsync(identity);
            case ChartTypeEnum.BarChart_Events_EventsPerHour:
                return this.getBarChartEventsEventsPerHourAsync(identity);
            case ChartTypeEnum.PieChart_Server_LanguageDistribution:
                return this.getPieChartServerLanguageDistributionAsync(identity);
            case ChartTypeEnum.PieChart_Games_GamesByType:
                return this.getPieChartGamesGamesByTypeAsync(identity);
            default:
                assertNever(chartEnum, ChartTypeEnum);
        }
    }

    // #region Bar & Line Charts

    private async getLineChartUserNewUserAsync(identity: User): Promise<ChartDefinition> {
        const chartData = await this.getChartData(StoredProcedureEnum.LineChartUserNewUser, [90]);

        return {
            title: new MultiLingualString(i18n.enums.charts[ChartTypeEnum.LineChart_User_NewUser]).getMessage(),
            type: ChartEnum.Line,
            ...chartData,
        };
    }

    private async getLineChartServerNewServerAsync(identity: User): Promise<ChartDefinition> {
        const chartData = await this.getChartData(StoredProcedureEnum.LineChartServerNewServer, [90]);

        return {
            title: new MultiLingualString(i18n.enums.charts[ChartTypeEnum.LineChart_Server_NewServer]).getMessage(),
            type: ChartEnum.Line,
            ...chartData,
        };
    }

    private async getBarChartEventsEventsByTypeAsync(identity: User): Promise<ChartDefinition> {
        const chartData = await this.getChartData(StoredProcedureEnum.BarChartEventsEventsByType, [1]);

        return {
            title: new MultiLingualString(i18n.enums.charts[ChartTypeEnum.BarChart_Events_EventsByType]).getMessage(),
            type: ChartEnum.Bar,
            ...chartData,
        };
    }

    private async getBarChartEventsActivityOverTimeAsync(identity: User): Promise<ChartDefinition> {
        const chartData = await this.getChartData(StoredProcedureEnum.BarChartEventsActivityOverTime, [30]);

        return {
            title: new MultiLingualString(i18n.enums.charts[ChartTypeEnum.BarChart_Events_ActivityOverTime]).getMessage(),
            type: ChartEnum.Bar,
            ...chartData,
        };
    }

    private async getBarChartEventsEventsPerHourAsync(identity: User): Promise<ChartDefinition> {
        const chartData = await this.getChartData(StoredProcedureEnum.BarChartEventsEventsPerHour, [7]);

        return {
            title: new MultiLingualString(i18n.enums.charts[ChartTypeEnum.BarChart_Events_EventsPerHour]).getMessage(),
            type: ChartEnum.Bar,
            ...chartData,
        };
    }

    private async getPieChartServerLanguageDistributionAsync(identity: User): Promise<ChartDefinition> {
        const chartData = await this.getChartData(StoredProcedureEnum.PieChartServerLanguageDistribution, []);

        return {
            title: new MultiLingualString(i18n.enums.charts[ChartTypeEnum.PieChart_Server_LanguageDistribution]).getMessage(),
            type: ChartEnum.Pie,
            ...chartData,
        };
    }

    private async getPieChartGamesGamesByTypeAsync(identity: User): Promise<ChartDefinition> {
        const chartData = await this.getChartData(StoredProcedureEnum.PieChartGamesGamesByType, [null]);

        return {
            title: new MultiLingualString(i18n.enums.charts[ChartTypeEnum.PieChart_Games_GamesByType]).getMessage(),
            type: ChartEnum.Pie,
            ...chartData,
        };
    }
    // #endregion

    // #region Helper Methods

    private async getChartData(storedProcedureEnum: StoredProcedureEnum, params: any[]): Promise<Pick<ChartDefinition, 'data' | 'xAxisKey' | 'valueKeys'>> {
        const chartData = await RepositoryUtils.CallStoredProcedureGeneric(storedProcedureEnum, params);
        if (!chartData)
            ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);

        const chart = chartData?.[0]?.ChartDefinition as Partial<ChartDefinition>;
        if (!chart.data || !chart.valueKeys || !chart.xAxisKey)
            ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);

        return {
            data: chart.data,
            xAxisKey: chart.xAxisKey,
            valueKeys: chart.valueKeys,
        };
    }

    // #endregion
}

const chartService = new ChartService();
registerService(chartService);
export default chartService;
