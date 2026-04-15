import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Tag } from 'lucide-react';
import { categoriesApi } from '@/api/categories';
import client from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import type { Category } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color').default('#6366f1'),
  icon: z.string().max(50).optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const PRESET_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
];

export function AdminCategoriesPage() {
  const [createModal, setCreateModal] = useState(false);
  const qc = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { color: '#6366f1' },
  });

  const selectedColor = watch('color');

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      client.post('/admin/types', values).then((r) => r.data),
    onSuccess: () => {
      setCreateModal(false);
      reset();
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      client.delete(`/admin/types/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });

  const flat = (cats: Category[]): Category[] =>
    cats.flatMap((c) => [c, ...(c.children ? flat(c.children) : [])]);

  const allCategories = categories ? flat(categories) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Types</h2>
          <p className="text-sm text-gray-500 mt-1">{allCategories.length} type{allCategories.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setCreateModal(true)}>
          <Plus size={16} /> New Type
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : allCategories.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <Tag size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No types yet.</p>
          <p className="text-sm text-gray-400 mt-1">Create your first type to organize tickets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {allCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: cat.color + '20' }}
                >
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{cat.name}</p>
                  {cat.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{cat.description}</p>
                  )}
                  <p className="text-xs text-gray-400 font-mono mt-1">{cat.color}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm(`Delete "${cat.name}"? Tickets with this type will become untyped.`)) {
                    deleteMutation.mutate(cat.id);
                  }
                }}
                className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => { setCreateModal(false); reset(); }} title="New Type">
        <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
          <Input
            label="Name *"
            placeholder="e.g. Bug, Feature Request..."
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Color *</label>
            <div className="flex items-center gap-3 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: selectedColor === color ? '#111' : 'transparent',
                  }}
                />
              ))}
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setValue('color', e.target.value)}
                className="h-8 w-8 rounded-full border border-gray-300 cursor-pointer"
                title="Custom color"
              />
            </div>
            {errors.color && <p className="text-xs text-red-600">{errors.color.message}</p>}
          </div>

          {/* Preview */}
          <div className="flex items-center gap-2 py-2">
            <span className="text-sm text-gray-500">Preview:</span>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ backgroundColor: selectedColor + '20', color: selectedColor }}
            >
              {watch('name') || 'Type Name'}
            </span>
          </div>

          <Input
            label="Icon (optional)"
            placeholder="e.g. bug, star, zap"
            {...register('icon')}
          />

          <Input
            label="Description (optional)"
            placeholder="Brief description..."
            {...register('description')}
          />

          {createMutation.isError && (
            <p className="text-sm text-red-600">Failed to create type. Please try again.</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={isSubmitting || createMutation.isPending}>
              Create Type
            </Button>
            <Button type="button" variant="outline" onClick={() => { setCreateModal(false); reset(); }}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
