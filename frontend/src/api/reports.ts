import client from './client';

export const reportsApi = {
  projects: async () => {
    const { data } = await client.get('/reports/projects');
    return data;
  },

  tasks: async (params?: { project_id?: number; assignee_id?: number; status?: string; priority?: string }) => {
    const { data } = await client.get('/reports/tasks', { params });
    return data;
  },

  tickets: async (params?: { project_id?: number; partner_id?: number; assignee_id?: number; status?: string; priority?: string }) => {
    const { data } = await client.get('/reports/tickets', { params });
    return data;
  },
};
