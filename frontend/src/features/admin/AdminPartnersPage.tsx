import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Building2, Pencil, Mail, Phone, Globe } from 'lucide-react';
import { partnersApi } from '@/api/partners';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import type { Partner } from '@/types';

const schema = z.object({
  name:    z.string().min(1, 'Name is required').max(150),
  company: z.string().max(150).optional().nullable(),
  email:   z.string().email('Invalid email').max(150).optional().or(z.literal('')).nullable(),
  phone:   z.string().max(50).optional().nullable(),
  website: z.string().url('Invalid URL').max(255).optional().or(z.literal('')).nullable(),
});

type FormValues = z.infer<typeof schema>;

function PartnerForm({
  defaultValues,
  onSubmit,
  isPending,
  isError,
  onCancel,
  submitLabel,
}: {
  defaultValues?: Partial<FormValues>;
  onSubmit: (v: FormValues) => void;
  isPending: boolean;
  isError: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {},
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Name *" placeholder="Contact or partner name" error={errors.name?.message} {...register('name')} />
      <Input label="Company" placeholder="Company / organisation" error={errors.company?.message} {...register('company')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Email" type="email" placeholder="partner@example.com" error={errors.email?.message} {...register('email')} />
        <Input label="Phone" placeholder="+1 555 000 0000" error={errors.phone?.message} {...register('phone')} />
      </div>
      <Input label="Website" placeholder="https://example.com" error={errors.website?.message} {...register('website')} />
      {isError && <p className="text-sm text-red-600">Something went wrong. Please try again.</p>}
      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={isPending}>{submitLabel}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export function AdminPartnersPage() {
  const [createModal, setCreateModal] = useState(false);
  const [editPartner, setEditPartner] = useState<Partner | null>(null);
  const qc = useQueryClient();

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: partnersApi.list,
  });

  const createMutation = useMutation({
    mutationFn: partnersApi.create,
    onSuccess: () => { setCreateModal(false); qc.invalidateQueries({ queryKey: ['partners'] }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormValues }) => partnersApi.update(id, data),
    onSuccess: () => { setEditPartner(null); qc.invalidateQueries({ queryKey: ['partners'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: partnersApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partners'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Partners</h2>
          <p className="text-sm text-gray-500 mt-1">{partners.length} partner{partners.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setCreateModal(true)}>
          <Plus size={16} /> New Partner
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : partners.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No partners yet.</p>
          <p className="text-sm text-gray-400 mt-1">Add partners to link them to tickets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {partners.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 group flex items-start justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Building2 size={18} className="text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                  {p.company && <p className="text-sm text-gray-500 truncate">{p.company}</p>}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                    {p.email && (
                      <a href={`mailto:${p.email}`} className="flex items-center gap-1 text-xs text-indigo-600 hover:underline truncate">
                        <Mail size={11} />{p.email}
                      </a>
                    )}
                    {p.phone && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Phone size={11} />{p.phone}
                      </span>
                    )}
                    {p.website && (
                      <a href={p.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-indigo-600 hover:underline truncate">
                        <Globe size={11} />{p.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                <button onClick={() => setEditPartner(p)} className="text-gray-400 hover:text-indigo-600 transition-colors" title="Edit">
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${p.name}"? Linked tickets will have their partner removed.`)) {
                      deleteMutation.mutate(p.id);
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

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="New Partner">
        <PartnerForm
          onSubmit={(v) => createMutation.mutate(v)}
          isPending={createMutation.isPending}
          isError={createMutation.isError}
          onCancel={() => setCreateModal(false)}
          submitLabel="Create Partner"
        />
      </Modal>

      <Modal open={!!editPartner} onClose={() => setEditPartner(null)} title="Edit Partner">
        {editPartner && (
          <PartnerForm
            defaultValues={editPartner}
            onSubmit={(v) => updateMutation.mutate({ id: editPartner.id, data: v })}
            isPending={updateMutation.isPending}
            isError={updateMutation.isError}
            onCancel={() => setEditPartner(null)}
            submitLabel="Save Changes"
          />
        )}
      </Modal>
    </div>
  );
}
