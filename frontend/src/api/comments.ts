import client from './client';
import type { Comment } from '@/types';

export const commentsApi = {
  list: async (ticketUlid: string) => {
    const { data } = await client.get<Comment[]>(`/tickets/${ticketUlid}/comments`);
    return data;
  },

  create: async (
    ticketUlid: string,
    payload: {
      body: string;
      parent_id?: number;
      is_internal?: boolean;
      minutes?: number;
      logged_date?: string;
      status?: string;
      priority?: string;
      label_id?: number | null;
      category_id?: number | null;
      due_date?: string | null;
      progress?: number;
    },
    files?: File[],
  ) => {
    const fd = new FormData();
    fd.append('body', payload.body);
    if (payload.parent_id != null) fd.append('parent_id', String(payload.parent_id));
    if (payload.is_internal != null) fd.append('is_internal', payload.is_internal ? '1' : '0');
    if (payload.minutes != null) fd.append('minutes', String(payload.minutes));
    if (payload.logged_date) fd.append('logged_date', payload.logged_date);
    if (payload.status) fd.append('status', payload.status);
    if (payload.priority) fd.append('priority', payload.priority);
    if (payload.label_id != null) fd.append('label_id', String(payload.label_id));
    if (payload.category_id != null) fd.append('category_id', String(payload.category_id));
    if (payload.due_date) fd.append('due_date', payload.due_date);
    if (payload.progress != null) fd.append('progress', String(payload.progress));
    if (files) files.forEach((f) => fd.append('files[]', f));
    const { data } = await client.post<Comment>(`/tickets/${ticketUlid}/comments`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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

export const taskCommentsApi = {
  list: async (taskUlid: string) => {
    const { data } = await client.get<Comment[]>(`/tasks/${taskUlid}/comments`);
    return data;
  },

  create: async (
    taskUlid: string,
    payload: {
      body: string;
      parent_id?: number;
      is_internal?: boolean;
      minutes?: number;
      logged_date?: string;
      status?: string;
      priority?: string;
      label_id?: number | null;
      category_id?: number | null;
      due_date?: string | null;
      progress?: number;
    },
    files?: File[],
  ) => {
    const fd = new FormData();
    fd.append('body', payload.body);
    if (payload.parent_id != null) fd.append('parent_id', String(payload.parent_id));
    if (payload.is_internal != null) fd.append('is_internal', payload.is_internal ? '1' : '0');
    if (payload.minutes != null) fd.append('minutes', String(payload.minutes));
    if (payload.logged_date) fd.append('logged_date', payload.logged_date);
    if (payload.status) fd.append('status', payload.status);
    if (payload.priority) fd.append('priority', payload.priority);
    if (payload.label_id != null) fd.append('label_id', String(payload.label_id));
    if (payload.category_id != null) fd.append('category_id', String(payload.category_id));
    if (payload.due_date) fd.append('due_date', payload.due_date);
    if (payload.progress != null) fd.append('progress', String(payload.progress));
    if (files) files.forEach((f) => fd.append('files[]', f));
    const { data } = await client.post<Comment>(`/tasks/${taskUlid}/comments`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  update: async (taskUlid: string, commentId: number, body: string) => {
    const { data } = await client.put<Comment>(`/tasks/${taskUlid}/comments/${commentId}`, { body });
    return data;
  },

  delete: async (taskUlid: string, commentId: number) => {
    await client.delete(`/tasks/${taskUlid}/comments/${commentId}`);
  },
};
