import { ChartEnum } from "../enums/application/ChartTypeEnum";

export interface ChartData {
    [key: string]: string | number;
}

export interface ChartDefinition {
    title: string;
    data: ChartData[];
    xAxisKey: string;
    valueKeys: string[];
    type?: ChartEnum;
}