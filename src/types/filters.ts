export type TimeFilter = '24h' | '7d' | '30d' | 'all';

export interface Filters {
  category: string | null;
  timeFrame: TimeFilter;
}

export const TIME_FILTERS: Record<TimeFilter, string> = {
  '24h': 'Last 24 Hours',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  'all': 'All Time'
};