import client from './client';
import type { Label } from '@/types';

export const labelsApi = {
  list: async (): Promise<Label[]> => {
    const { data } = await client.get<Label[]>('/labels');
    return data;
  },
  create: async (payload: { name: string; color: string }): Promise<Label> => {
    const { data } = await client.post<Label>('/admin/labels', payload);
    return data;
  },
  update: async (id: number, payload: { name?: string; color?: string }): Promise<Label> => {
    const { data } = await client.put<Label>(`/admin/labels/${id}`, payload);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await client.delete(`/admin/labels/${id}`);
  },
};
