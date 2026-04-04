import { Duration } from "../application";
import { ChartDefinition } from "../application/Chart";
import { MetricEnum } from "../enums";

export interface DashboardResponse {
  title: string;
  cards: DashboardSectionCardData[];
  charts?: ChartDefinition[];
}

export type TrendDirection = "up" | "down";

export type DashboardSectionCardData = {
  id: string
  metricEnum?: MetricEnum
  title: string
  description?: string
  value: string | number
  trend?: {
    direction: TrendDirection
    percentage: number
    label: string
  }
  footer?: {
    primaryText: string
    secondaryText: string
  }
}

export type DashboardSectionCardsProps = {
  cards: DashboardSectionCardData[]
  className?: string
}

export interface TimeframeData {
  timeFrame: Duration;
  currentValue: number;
  previousValue: number;
}