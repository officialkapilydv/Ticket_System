import client from './client';
import type { Comment } from '@/types';

export const commentsApi = {
  list: async (ticketUlid: string) => {
    const { data } = await client.get<Comment[]>(`/tickets/${ticketUlid}/comments`);
    return data;
  },

  create: async (
    ticketUlid: string,
    payload: { body: string; parent_id?: number; is_internal?: boolean },
    files?: File[],
  ) => {
    if (files && files.length > 0) {
      const fd = new FormData();
      fd.append('body', payload.body);
      if (payload.parent_id != null) fd.append('parent_id', String(payload.parent_id));
      if (payload.is_internal != null) fd.append('is_internal', payload.is_internal ? '1' : '0');
      files.forEach((f) => fd.append('files[]', f));
      const { data } = await client.post<Comment>(`/tickets/${ticketUlid}/comments`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    }
    const { data } = await client.post<Comment>(`/tickets/${ticketUlid}/comments`, payload);
    return data;
  },

  update: async (ticketUlid: string, commentId: number, body: string) => {
    const { data } = await client.put<Comment>(`/tickets/${ticketUlid}/comments/${commentId}`, { body });
    return data;
  },

  delete: async (ticketUlid: string, commentId: number) => {
    await client.delete(`/tickets/${ticketUlid}/comments/${commentId}`);
  },
};
