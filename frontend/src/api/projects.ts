import client from './client';
import type { Project, Milestone } from '@/types';

export interface ProjectPayload {
  name: string;
  key: string;
  description?: string | null;
  color?: string;
  status?: 'active' | 'archived';
  owner_id?: number | null;
}

export interface MilestonePayload {
  name: string;
  description?: string | null;
  status?: 'planned' | 'active' | 'completed';
  start_date?: string | null;
  due_date?: string | null;
}

export const projectsApi = {
  list: async () => {
    const { data } = await client.get<Project[]>('/projects');
    return data;
  },

  get: async (id: number) => {
    const { data } = await client.get<Project>(`/projects/${id}`);
    return data;
  },

  create: async (payload: ProjectPayload) => {
    const { data } = await client.post<Project>('/projects', payload);
    return data;
  },

  update: async (id: number, payload: Partial<ProjectPayload>) => {
    const { data } = await client.put<Project>(`/projects/${id}`, payload);
    return data;
  },

  delete: async (id: number) => {
    await client.delete(`/projects/${id}`);
  },

  // Milestones
  listMilestones: async (projectId: number) => {
    const { data } = await client.get<Milestone[]>(`/projects/${projectId}/milestones`);
    return data;
  },

  createMilestone: async (projectId: number, payload: MilestonePayload) => {
    const { data } = await client.post<Milestone>(`/projects/${projectId}/milestones`, payload);
    return data;
  },

  updateMilestone: async (projectId: number, milestoneId: number, payload: Partial<MilestonePayload>) => {
    const { data } = await client.put<Milestone>(`/projects/${projectId}/milestones/${milestoneId}`, payload);
    return data;
  },

  deleteMilestone: async (projectId: number, milestoneId: number) => {
    await client.delete(`/projects/${projectId}/milestones/${milestoneId}`);
  },
};
