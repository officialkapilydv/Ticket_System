import client from './client';
import type { TimeLog } from '@/types';

export const timeLogsApi = {
  list: async (ticketUlid: string) => {
    const { data } = await client.get<TimeLog[]>(`/tickets/${ticketUlid}/time-logs`);
    return data;
  },

  log: async (ticketUlid: string, payload: { logged_date: string; minutes: number; description?: string }) => {
    const { data } = await client.post<TimeLog>(`/tickets/${ticketUlid}/time-logs`, payload);
    return data;
  },

  delete: async (ticketUlid: string, logId: number) => {
    await client.delete(`/tickets/${ticketUlid}/time-logs/${logId}`);
  },

  myReport: async (from: string, to: string) => {
    const { data } = await client.get('/time-logs/report', { params: { from, to } });
    return data;
  },

  fullReport: async (from: string, to: string, userId?: number) => {
    const { data } = await client.get('/time-logs/full-report', {
      params: { from, to, user_id: userId },
    });
    return data;
  },
};
