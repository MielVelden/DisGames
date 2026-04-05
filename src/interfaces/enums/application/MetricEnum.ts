import { SetMetricType } from "../../../utils/helpers/EnumMetadata";

export enum MetricTypeEnum {
    Push = "push",
    Pull = "pull",
}

export enum MetricEnum {
    ActiveGames = 1,
    Servers = 2,
    Guilds = 3,
    Users = 4,
    Points = 5,
    Events = 6, //TODO
    Members = 7,
    ServerMembers = 8,
}

SetMetricType(MetricEnum, MetricEnum.ActiveGames, MetricTypeEnum.Push);
SetMetricType(MetricEnum, MetricEnum.Servers, MetricTypeEnum.Push);
SetMetricType(MetricEnum, MetricEnum.Guilds, MetricTypeEnum.Push);
SetMetricType(MetricEnum, MetricEnum.Users, MetricTypeEnum.Push);
SetMetricType(MetricEnum, MetricEnum.Points, MetricTypeEnum.Push);
SetMetricType(MetricEnum, MetricEnum.Events, MetricTypeEnum.Push);
