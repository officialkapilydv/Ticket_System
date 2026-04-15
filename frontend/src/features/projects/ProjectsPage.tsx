import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FolderOpen, Archive, Trash2, Pencil, X, Check } from 'lucide-react';
import { projectsApi, type ProjectPayload } from '@/api/projects';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import type { Project } from '@/types';

const COLOR_OPTIONS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

function ProjectFormModal({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Project;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(initial?.name ?? '');
  const [key, setKey] = useState(initial?.key ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [color, setColor] = useState(initial?.color ?? '#6366f1');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (payload: ProjectPayload) =>
      initial ? projectsApi.update(initial.id, payload) : projectsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
    onError: () => setError('Something went wrong. Please try again.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !key.trim()) {
      setError('Name and Key are required.');
      return;
    }
    mutation.mutate({ name: name.trim(), key: key.trim().toUpperCase(), description: description || null, color });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Project' : 'New Project'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>
        )}
        <Input
          label="Project Name *"
          placeholder="e.g. Backend Refactor"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Project Key *"
          placeholder="e.g. BACK (uppercase, no spaces)"
          value={key}
          onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          maxLength={10}
        />
        <Textarea
          label="Description"
          rows={3}
          placeholder="What is this project about?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? '#111' : 'transparent',
                  transform: color === c ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={mutation.isPending}>
            {initial ? 'Save Changes' : 'Create Project'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}

export function ProjectsPage() {
  const { isAdmin, user } = useAuthStore();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | undefined>();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: projectsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'active' | 'archived' }) =>
      projectsApi.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  const canManage = isAdmin() || true; // agents can create projects per policy

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <p className="text-sm text-gray-500 mt-1">{projects?.length ?? 0} projects</p>
        </div>
        {canManage && (
          <Button onClick={() => { setEditing(undefined); setShowForm(true); }}>
            <Plus size={16} />
            New Project
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-500">Loading projects...</div>
      ) : projects?.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No projects yet.</p>
          {canManage && (
            <button
              onClick={() => setShowForm(true)}
              className="text-indigo-600 text-sm mt-2 hover:underline"
            >
              Create your first project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects?.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  >
                    {project.key.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <Link
                      to={`/projects/${project.id}`}
                      className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors block truncate"
                    >
                      {project.name}
                    </Link>
                    <span className="text-xs font-mono text-gray-400">{project.key}</span>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    project.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {project.status}
                </span>
              </div>

              {project.description && (
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.description}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <span>{project.tickets_count ?? 0} tickets</span>
                <span>{project.milestones_count ?? 0} milestones</span>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <Link to={`/projects/${project.id}`}>
                  <Button size="sm" variant="outline">View</Button>
                </Link>
                {(isAdmin() || project.owner_id === user?.id) && (
                  <>
                    <button
                      onClick={() => { setEditing(project); setShowForm(true); }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => archiveMutation.mutate({ id: project.id, status: project.status === 'active' ? 'archived' : 'active' })}
                      className="p-1.5 text-gray-400 hover:text-amber-600 transition-colors"
                      title={project.status === 'active' ? 'Archive' : 'Restore'}
                    >
                      <Archive size={14} />
                    </button>
                    {isAdmin() && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete project "${project.name}"? This will not delete its tickets.`)) {
                            deleteMutation.mutate(project.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ProjectFormModal
          open={showForm}
          onClose={() => { setShowForm(false); setEditing(undefined); }}
          initial={editing}
        />
      )}
    </div>
  );
}
