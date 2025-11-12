export interface ChartData {
    [key: string]: string | number;
}

export interface ChartDefinition {
    title: string;
    data: ChartData[];
    xAxisKey: string;
    valueKeys: string[];
    type?: "area" | "line" | "bar";
}