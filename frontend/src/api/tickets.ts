import client from './client';
import type { Ticket, PaginatedResponse, AuditLog } from '@/types';

export interface TicketFilters {
  status?: string;
  priority?: string;
  category_id?: number;
  assignee_id?: number;
  'filter[title]'?: string;
  sort?: string;
  page?: number;
  per_page?: number;
}

export const ticketsApi = {
  list: async (filters: TicketFilters = {}) => {
    const params: Record<string, unknown> = {};
    if (filters.status) params['filter[status]'] = filters.status;
    if (filters.priority) params['filter[priority]'] = filters.priority;
    if (filters.category_id) params['filter[category_id]'] = filters.category_id;
    if (filters.assignee_id) params['filter[assignee_id]'] = filters.assignee_id;
    if (filters['filter[title]']) params['filter[title]'] = filters['filter[title]'];
    if (filters.sort) params.sort = filters.sort;
    params.page = filters.page ?? 1;
    params.per_page = filters.per_page ?? 20;

    const { data } = await client.get<PaginatedResponse<Ticket>>('/tickets', { params });
    return data;
  },

  get: async (ulid: string) => {
    const { data } = await client.get<Ticket>(`/tickets/${ulid}`);
    return data;
  },

  create: async (payload: Partial<Ticket>) => {
    const { data } = await client.post<Ticket>('/tickets', payload);
    return data;
  },

  update: async (ulid: string, payload: Partial<Ticket>) => {
    const { data } = await client.put<Ticket>(`/tickets/${ulid}`, payload);
    return data;
  },

  delete: async (ulid: string) => {
    await client.delete(`/tickets/${ulid}`);
  },

  changeStatus: async (ulid: string, status: string) => {
    const { data } = await client.patch<Ticket>(`/tickets/${ulid}/status`, { status });
    return data;
  },

  assign: async (ulid: string, assigneeId: number | null) => {
    const { data } = await client.post<Ticket>(`/tickets/${ulid}/assign`, { assignee_id: assigneeId });
    return data;
  },

  history: async (ulid: string) => {
    const { data } = await client.get<AuditLog[]>(`/tickets/${ulid}/history`);
    return data;
  },
};
