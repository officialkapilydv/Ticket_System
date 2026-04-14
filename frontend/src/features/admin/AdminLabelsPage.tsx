import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Tag, Pencil } from 'lucide-react';
import { labelsApi } from '@/api/labels';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import type { Label } from '@/types';

const schema = z.object({
  name:  z.string().min(1, 'Name is required').max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color').default('#6366f1'),
});

type FormValues = z.infer<typeof schema>;

const PRESET_COLORS = [
  '#6366f1', '#3b82f6', '#0ea5e9', '#10b981',
  '#f59e0b', '#f97316', '#ef4444', '#f43f5e',
  '#8b5cf6', '#ec4899', '#14b8a6', '#84cc16',
];

export function AdminLabelsPage() {
  const [createModal, setCreateModal] = useState(false);
  const [editLabel, setEditLabel] = useState<Label | null>(null);
  const qc = useQueryClient();

  const { data: labels = [], isLoading } = useQuery({
    queryKey: ['labels'],
    queryFn: labelsApi.list,
  });

  // Create form
  const createForm = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { color: '#6366f1' },
  });
  const createColor = createForm.watch('color');

  // Edit form
  const editForm = useForm<FormValues>({
    resolver: zodResolver(schema),
  });
  const editColor = editForm.watch('color');

  const createMutation = useMutation({
    mutationFn: labelsApi.create,
    onSuccess: () => {
      setCreateModal(false);
      createForm.reset({ color: '#6366f1' });
      qc.invalidateQueries({ queryKey: ['labels'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormValues }) => labelsApi.update(id, data),
    onSuccess: () => {
      setEditLabel(null);
      qc.invalidateQueries({ queryKey: ['labels'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: labelsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labels'] }),
  });

  const openEdit = (label: Label) => {
    setEditLabel(label);
    editForm.reset({ name: label.name, color: label.color });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Labels</h2>
          <p className="text-sm text-gray-500 mt-1">{labels.length} label{labels.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setCreateModal(true)}>
          <Plus size={16} /> New Label
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : labels.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <Tag size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No labels yet.</p>
          <p className="text-sm text-gray-400 mt-1">Create labels to tag and organize tickets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {labels.map((label) => (
            <div
              key={label.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: label.color + '20' }}
                >
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: label.color }} />
                </div>
                <div>
                  <span
                    className="text-sm px-2.5 py-1 rounded-full font-medium"
                    style={{ backgroundColor: label.color + '20', color: label.color }}
                  >
                    {label.name}
                  </span>
                  <p className="text-xs text-gray-400 font-mono mt-1.5">{label.color}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(label)}
                  className="text-gray-400 hover:text-indigo-600 transition-colors"
                  title="Edit"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${label.name}"? Tickets using this label will become unlabelled.`)) {
                      deleteMutation.mutate(label.id);
                    }
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => { setCreateModal(false); createForm.reset({ color: '#6366f1' }); }} title="New Label">
        <form onSubmit={createForm.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
          <Input
            label="Name *"
            placeholder="e.g. Bug, Feature, Urgent..."
            error={createForm.formState.errors.name?.message}
            {...createForm.register('name')}
          />

          <ColorPicker
            label="Color *"
            value={createColor}
            onChange={(c) => createForm.setValue('color', c)}
            error={createForm.formState.errors.color?.message}
            register={createForm.register('color')}
          />

          {/* Preview */}
          <div className="flex items-center gap-2 py-1">
            <span className="text-sm text-gray-500">Preview:</span>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ backgroundColor: createColor + '20', color: createColor }}
            >
              {createForm.watch('name') || 'Label Name'}
            </span>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-red-600">Failed to create label. Name may already exist.</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={createMutation.isPending}>Create Label</Button>
            <Button type="button" variant="outline" onClick={() => { setCreateModal(false); createForm.reset({ color: '#6366f1' }); }}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editLabel} onClose={() => setEditLabel(null)} title="Edit Label">
        <form
          onSubmit={editForm.handleSubmit((v) => updateMutation.mutate({ id: editLabel!.id, data: v }))}
          className="space-y-4"
        >
          <Input
            label="Name *"
            error={editForm.formState.errors.name?.message}
            {...editForm.register('name')}
          />

          <ColorPicker
            label="Color *"
            value={editColor}
            onChange={(c) => editForm.setValue('color', c)}
            error={editForm.formState.errors.color?.message}
            register={editForm.register('color')}
          />

          {/* Preview */}
          <div className="flex items-center gap-2 py-1">
            <span className="text-sm text-gray-500">Preview:</span>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ backgroundColor: editColor + '20', color: editColor }}
            >
              {editForm.watch('name') || 'Label Name'}
            </span>
          </div>

          {updateMutation.isError && (
            <p className="text-sm text-red-600">Failed to update label.</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={updateMutation.isPending}>Save Changes</Button>
            <Button type="button" variant="outline" onClick={() => setEditLabel(null)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Shared color picker sub-component
function ColorPicker({
  label, value, onChange, error, register,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
  error?: string;
  register: ReturnType<ReturnType<typeof useForm>['register']>;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2 flex-wrap">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              backgroundColor: color,
              borderColor: value === color ? '#111' : 'transparent',
            }}
          />
        ))}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-7 rounded-full border border-gray-300 cursor-pointer"
          title="Custom color"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <input type="hidden" {...register} />
    </div>
  );
}
