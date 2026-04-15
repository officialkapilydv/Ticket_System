import client from './client';
import type { Task, PaginatedResponse } from '@/types';

export interface TaskFilters {
  status?: string;
  priority?: string;
  category_id?: number;
  assignee_id?: number;
  project_id?: number;
  milestone_id?: number;
  'filter[title]'?: string;
  sort?: string;
  page?: number;
  per_page?: number;
}

export const tasksApi = {
  list: async (filters: TaskFilters = {}) => {
    const params: Record<string, unknown> = {};
    if (filters.status) params['filter[status]'] = filters.status;
    if (filters.priority) params['filter[priority]'] = filters.priority;
    if (filters.category_id) params['filter[category_id]'] = filters.category_id;
    if (filters.assignee_id) params['filter[assignee_id]'] = filters.assignee_id;
    if (filters.project_id) params['filter[project_id]'] = filters.project_id;
    if (filters.milestone_id) params['filter[milestone_id]'] = filters.milestone_id;
    if (filters['filter[title]']) params['filter[title]'] = filters['filter[title]'];
    if (filters.sort) params.sort = filters.sort;
    params.page = filters.page ?? 1;
    params.per_page = filters.per_page ?? 20;

    const { data } = await client.get<PaginatedResponse<Task>>('/tasks', { params });
    return data;
  },

  get: async (ulid: string) => {
    const { data } = await client.get<Task>(`/tasks/${ulid}`);
    return data;
  },

  create: async (payload: Partial<Task> & { assignee_ids?: number[] }) => {
    const { data } = await client.post<Task>('/tasks', payload);
    return data;
  },

  update: async (ulid: string, payload: Partial<Task> & { assignee_ids?: number[] }) => {
    const { data } = await client.put<Task>(`/tasks/${ulid}`, payload);
    return data;
  },

  delete: async (ulid: string) => {
    await client.delete(`/tasks/${ulid}`);
  },

  changeStatus: async (ulid: string, status: string) => {
    const { data } = await client.patch<Task>(`/tasks/${ulid}/status`, { status });
    return data;
  },

  assign: async (ulid: string, assigneeIds: number[]) => {
    const { data } = await client.post<Task>(`/tasks/${ulid}/assign`, { assignee_ids: assigneeIds });
    return data;
  },
};
