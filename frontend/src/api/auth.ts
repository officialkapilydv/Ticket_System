import client from './client';
import type { User } from '@/types';

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await client.post<{ token: string; user: User }>('/auth/login', { email, password });
    return data;
  },

  logout: async () => {
    await client.post('/auth/logout');
  },

  me: async () => {
    const { data } = await client.get<User>('/auth/me');
    return data;
  },

  updateProfile: async (formData: FormData) => {
    const { data } = await client.put('/auth/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  changePassword: async (payload: { current_password: string; password: string; password_confirmation: string }) => {
    const { data } = await client.put('/auth/password', payload);
    return data;
  },
};
