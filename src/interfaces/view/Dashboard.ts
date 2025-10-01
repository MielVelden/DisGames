export interface DashboardView {
    cards: DashboardSectionCardData[]
    chart?: any;
}

export type TrendDirection = "up" | "down";

export type DashboardSectionCardData = {
  id: string
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