import client from './client';
import type { Partner } from '@/types';

export interface PartnerPayload {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  website?: string | null;
}

export const partnersApi = {
  list: async (): Promise<Partner[]> => {
    const { data } = await client.get<Partner[]>('/partners');
    return data;
  },
  create: async (payload: PartnerPayload): Promise<Partner> => {
    const { data } = await client.post<Partner>('/admin/partners', payload);
    return data;
  },
  update: async (id: number, payload: PartnerPayload): Promise<Partner> => {
    const { data } = await client.put<Partner>(`/admin/partners/${id}`, payload);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await client.delete(`/admin/partners/${id}`);
  },
};
