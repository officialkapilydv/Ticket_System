import client from './client';
import type { Category } from '@/types';

export const categoriesApi = {
  list: async () => {
    const { data } = await client.get<Category[]>('/types');
    return data;
  },
};
