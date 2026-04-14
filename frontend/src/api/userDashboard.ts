import client from './client';
import type { Ticket } from '@/types';

export interface UserDashboardStats {
  total_assigned: number;
  open: number;
  in_progress: number;
  resolved: number;
  overdue: number;
  progress_pct: number;
  by_status: Record<string, number>;
}

export interface UserDashboardData {
  stats: UserDashboardStats;
  tickets: Ticket[];
}

export const userDashboardApi = {
  summary: async (): Promise<UserDashboardData> => {
    const { data } = await client.get<UserDashboardData>('/dashboard/my-summary');
    return data;
  },
};
