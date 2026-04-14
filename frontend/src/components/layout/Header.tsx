import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import client from '@/api/client';

export function Header({ title }: { title: string }) {
  const { data } = useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: async () => {
      const { data } = await client.get<{ count: number }>('/notifications/unread-count');
      return data;
    },
    refetchInterval: 60_000,
  });

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-4">
        <button className="relative text-gray-400 hover:text-gray-600 transition-colors">
          <Bell size={20} />
          {(data?.count ?? 0) > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {data!.count > 9 ? '9+' : data!.count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
