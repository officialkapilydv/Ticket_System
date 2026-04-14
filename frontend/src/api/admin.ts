import client from './client';
import type { DashboardSummary, User, PaginatedResponse } from '@/types';

export const adminApi = {
  dashboardSummary: async () => {
    const { data } = await client.get<DashboardSummary>('/admin/dashboard/summary');
    return data;
  },

  timeReport: async (from: string, to: string, userId?: number) => {
    const { data } = await client.get('/admin/dashboard/time-report', {
      params: { from, to, user_id: userId },
    });
    return data;
  },

  ticketStats: async () => {
    const { data } = await client.get('/admin/dashboard/ticket-stats');
    return data;
  },

  listUsers: async (params?: { search?: string; role?: string; page?: number }) => {
    const { data } = await client.get<PaginatedResponse<User>>('/users', { params });
    return data;
  },

  createUser: async (payload: { name: string; email: string; password: string; role: string }) => {
    const { data } = await client.post<User>('/admin/users', payload);
    return data;
  },

  updateUser: async (id: number, payload: Partial<User>) => {
    const { data } = await client.put<User>(`/admin/users/${id}`, payload);
    return data;
  },

  toggleUserActive: async (id: number) => {
    const { data } = await client.patch<{ user: User }>(`/admin/users/${id}/deactivate`);
    return data;
  },

  userProfile: async (id: number) => {
    const { data } = await client.get(`/admin/users/${id}/profile`);
    return data;
  },
};
