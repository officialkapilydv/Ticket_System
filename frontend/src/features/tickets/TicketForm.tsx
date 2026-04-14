import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { ticketsApi } from '@/api/tickets';
import { categoriesApi } from '@/api/categories';
import { labelsApi } from '@/api/labels';
import { adminApi } from '@/api/admin';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  label_id: z.coerce.number().optional().nullable(),
  category_id: z.coerce.number().optional().nullable(),
  assignee_id: z.coerce.number().optional().nullable(),
  due_date: z.string().optional().nullable(),
  estimated_hours: z.coerce.number().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

export function TicketForm() {
  const navigate = useNavigate();
  const { ulid } = useParams<{ ulid?: string }>();
  const isEdit = Boolean(ulid);
  const qc = useQueryClient();

  const { data: ticket } = useQuery({
    queryKey: ['ticket', ulid],
    queryFn: () => ticketsApi.get(ulid!),
    enabled: isEdit,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  });

  const { data: agents } = useQuery({
    queryKey: ['users', 'agents'],
    queryFn: adminApi.listUsers,
  });

  const { data: labels } = useQuery({
    queryKey: ['labels'],
    queryFn: labelsApi.list,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium' },
  });

  useEffect(() => {
    if (ticket) {
      reset({
        title: ticket.title,
        description: ticket.description ?? '',
        priority: ticket.priority,
        label_id: ticket.label_id,
        category_id: ticket.category_id,
        assignee_id: ticket.assignee_id,
        due_date: ticket.due_date ?? '',
        estimated_hours: ticket.estimated_hours ?? undefined,
      });
    }
  }, [ticket, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit
        ? ticketsApi.update(ulid!, values)
        : ticketsApi.create(values),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['ticket', data.ulid] });
      navigate(`/tickets/${data.ulid}`);
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate({
      ...values,
      label_id: values.label_id || null,
      category_id: values.category_id || null,
      assignee_id: values.assignee_id || null,
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Ticket' : 'Create New Ticket'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            Something went wrong. Please try again.
          </div>
        )}

        <Input
          label="Title *"
          placeholder="Brief description of the issue..."
          error={errors.title?.message}
          {...register('title')}
        />

        <Textarea
          label="Description"
          rows={6}
          placeholder="Provide detailed information, steps to reproduce, expected vs actual behavior..."
          {...register('description')}
        />

        <div className="grid grid-cols-3 gap-4">
          <Select label="Priority *" error={errors.priority?.message} {...register('priority')}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>

          <Select label="Label" {...register('label_id')}>
            <option value="">No label</option>
            {labels?.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </Select>

          <Select label="Category" {...register('category_id')}>
            <option value="">No category</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Assignee" {...register('assignee_id')}>
            <option value="">Unassigned</option>
            {agents?.data?.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>

          <Input
            label="Due Date"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            {...register('due_date')}
          />
        </div>

        <Input
          label="Estimated Hours"
          type="number"
          min="0"
          max="9999"
          step="0.5"
          placeholder="e.g. 4"
          {...register('estimated_hours')}
        />

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Ticket'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
