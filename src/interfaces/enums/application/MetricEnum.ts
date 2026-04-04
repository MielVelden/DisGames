import { SetMetricType } from "../../../utils/helpers/EnumMetadata";

export enum MetricTypeEnum {
    Push = "push",
    Pull = "pull",
}

export enum MetricEnum {
    ActiveGames = "ActiveGames",
    Servers = "Servers",
    Guilds = "Guilds",
    Users = "Users",
    Points = "Points",
    Events = "Events",
}

SetMetricType(MetricEnum, MetricEnum.ActiveGames, MetricTypeEnum.Push);
SetMetricType(MetricEnum, MetricEnum.Servers, MetricTypeEnum.Push);
SetMetricType(MetricEnum, MetricEnum.Guilds, MetricTypeEnum.Push);
SetMetricType(MetricEnum, MetricEnum.Users, MetricTypeEnum.Push);
SetMetricType(MetricEnum, MetricEnum.Points, MetricTypeEnum.Push);
SetMetricType(MetricEnum, MetricEnum.Events, MetricTypeEnum.Push);
