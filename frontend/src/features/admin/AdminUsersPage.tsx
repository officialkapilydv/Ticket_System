import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/api/admin';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatRelative } from '@/utils/formatters';
import { Plus } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'agent', 'user']),
});

type FormValues = z.infer<typeof schema>;

export function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: () => adminApi.listUsers({ search: search || undefined }),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'user' },
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createUser,
    onSuccess: () => { setCreateModal(false); reset(); qc.invalidateQueries({ queryKey: ['admin', 'users'] }); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => adminApi.toggleUserActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <Button onClick={() => setCreateModal(true)}>
          <Plus size={16} /> New User
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.data?.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/admin/users/${user.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar_url} name={user.name} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'agent' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {formatRelative((user as unknown as { created_at: string }).created_at)}
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant={user.is_active ? 'danger' : 'secondary'}
                      size="sm"
                      loading={toggleMutation.isPending}
                      onClick={() => toggleMutation.mutate(user.id)}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create User">
        <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
          <Input label="Full Name" error={errors.name?.message} {...register('name')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />
          <Select label="Role" {...register('role')}>
            <option value="user">User</option>
            <option value="agent">Agent</option>
            <option value="admin">Admin</option>
          </Select>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={isSubmitting}>Create User</Button>
            <Button type="button" variant="outline" onClick={() => setCreateModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
