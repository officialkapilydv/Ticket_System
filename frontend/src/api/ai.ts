import client from './client';

export interface AiChatRequest {
  message: string;
  session_id?: string | null;
}

export interface AiActionResult {
  success: boolean;
  ticket_ulid?: string;
  ticket_id?: number;
  title?: string;
  status?: string;
  priority?: string;
  url?: string;
  error?: string;
  minutes?: number;
  hours?: number;
  logged_date?: string;
  comment_id?: number;
  assignees?: string;
  new_status?: string;
  tickets?: AiTicketResult[];
  message?: string;
  updated?: string[];
}

export interface AiTicketResult {
  ulid: string;
  title: string;
  status: string;
  priority: string;
  reporter: string | null;
  assignees: string;
  due_date: string | null;
  url: string;
}

export interface AiChatResponse {
  session_id: string;
  reply: string;
  action_taken: AiActionResult | null;
  tool_name?: string;
}

export interface AiConversation {
  id: number;
  session_id: string;
  title: string | null;
  last_active_at: string;
  created_at: string;
}

export const aiApi = {
  chat: async (payload: AiChatRequest): Promise<AiChatResponse> => {
    const { data } = await client.post<AiChatResponse>('/ai/chat', payload);
    return data;
  },

  conversations: async (): Promise<AiConversation[]> => {
    const { data } = await client.get<AiConversation[]>('/ai/conversations');
    return data;
  },
};
