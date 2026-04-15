import { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { tasksApi } from '@/api/tasks';
import { categoriesApi } from '@/api/categories';
import { labelsApi } from '@/api/labels';
import { projectsApi } from '@/api/projects';
import { adminApi } from '@/api/admin';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  label_id: z.coerce.number().optional().nullable(),
  category_id: z.coerce.number().optional().nullable(),
  assignee_ids: z.array(z.number()).optional(),
  project_id: z.coerce.number().optional().nullable(),
  milestone_id: z.coerce.number().optional().nullable(),
  due_date: z.string().optional().nullable(),
  estimated_hours: z.coerce.number().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

export function TaskForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { ulid } = useParams<{ ulid?: string }>();
  const isEdit = Boolean(ulid);
  const qc = useQueryClient();

  const locationState = location.state as { project_id?: number; milestone_id?: number } | null;

  const { data: task } = useQuery({
    queryKey: ['task', ulid],
    queryFn: () => tasksApi.get(ulid!),
    enabled: isEdit,
  });

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });
  const { data: agents } = useQuery({ queryKey: ['users', 'agents'], queryFn: adminApi.listUsers });
  const { data: labels } = useQuery({ queryKey: ['labels'], queryFn: labelsApi.list });
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.list });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: 'medium',
      assignee_ids: [],
      project_id: locationState?.project_id ?? null,
      milestone_id: locationState?.milestone_id ?? null,
    },
  });

  const selectedAssigneeIds = watch('assignee_ids') ?? [];
  const toggleAssignee = (id: number) => {
    const current = selectedAssigneeIds;
    setValue('assignee_ids', current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  const selectedProjectId = watch('project_id');

  const { data: milestones } = useQuery({
    queryKey: ['milestones', selectedProjectId],
    queryFn: () => projectsApi.listMilestones(Number(selectedProjectId)),
    enabled: !!selectedProjectId,
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        label_id: task.label_id,
        project_id: task.project_id,
        milestone_id: task.milestone_id,
        category_id: task.category_id,
        assignee_ids: task.assignees?.map((a) => a.id) ?? [],
        due_date: task.due_date ?? '',
        estimated_hours: task.estimated_hours ?? undefined,
      });
    }
  }, [task, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit
        ? tasksApi.update(ulid!, values)
        : tasksApi.create(values),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['task', data.ulid] });
      navigate(`/tasks/${data.ulid}`);
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate({
      ...values,
      label_id: values.label_id || null,
      category_id: values.category_id || null,
      assignee_ids: values.assignee_ids ?? [],
      project_id: values.project_id || null,
      milestone_id: values.milestone_id || null,
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Task' : 'Create New Task'}
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
          placeholder="Brief description of the task..."
          error={errors.title?.message}
          {...register('title')}
        />

        <Textarea
          label="Description"
          rows={6}
          placeholder="Provide detailed information, steps, acceptance criteria..."
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

          <Select label="Type" {...register('category_id')}>
            <option value="">No type</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Assignees</label>
          <div className="border border-gray-300 rounded-lg max-h-32 overflow-y-auto divide-y divide-gray-100">
            {agents?.data?.length ? agents.data.map((u) => (
              <label key={u.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedAssigneeIds.includes(u.id)}
                  onChange={() => toggleAssignee(u.id)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{u.name}</span>
              </label>
            )) : (
              <p className="px-3 py-2 text-sm text-gray-400">No agents available</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Project" {...register('project_id')}>
            <option value="">No project</option>
            {projects?.filter((p) => p.status === 'active').map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.key})</option>
            ))}
          </Select>

          <Select label="Milestone" {...register('milestone_id')} disabled={!selectedProjectId}>
            <option value="">No milestone</option>
            {milestones?.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Due Date"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            {...register('due_date')}
          />
          <Input
            label="Estimated Hours"
            type="number"
            min="0"
            max="9999"
            step="0.5"
            placeholder="e.g. 4"
            {...register('estimated_hours')}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Task'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
