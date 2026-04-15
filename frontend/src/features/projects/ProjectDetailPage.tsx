import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2, Flag, CheckCircle2, Clock, Circle, Search, X } from 'lucide-react';
import { projectsApi, type MilestonePayload } from '@/api/projects';
import { ticketsApi } from '@/api/tickets';
import { tasksApi } from '@/api/tasks';
import { adminApi } from '@/api/admin';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate } from '@/utils/formatters';
import type { Milestone } from '@/types';

const STATUS_ICON: Record<string, React.ReactNode> = {
  planned: <Circle size={14} className="text-gray-400" />,
  active: <Clock size={14} className="text-blue-500" />,
  completed: <CheckCircle2 size={14} className="text-green-500" />,
};

function MilestoneFormModal({
  open,
  onClose,
  projectId,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  projectId: number;
  initial?: Milestone;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState<MilestonePayload['status']>(initial?.status ?? 'planned');
  const [startDate, setStartDate] = useState(initial?.start_date ?? '');
  const [dueDate, setDueDate] = useState(initial?.due_date ?? '');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (payload: MilestonePayload) =>
      initial
        ? projectsApi.updateMilestone(projectId, initial.id, payload)
        : projectsApi.createMilestone(projectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['milestones', projectId] });
      onClose();
    },
    onError: () => setError('Something went wrong. Please try again.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Name is required.'); return; }
    mutation.mutate({
      name: name.trim(),
      description: description || null,
      status,
      start_date: startDate || null,
      due_date: dueDate || null,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Milestone' : 'New Milestone'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>
        )}
        <Input
          label="Milestone Name *"
          placeholder="e.g. v1.0 Release"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Textarea
          label="Description"
          rows={3}
          placeholder="What does this milestone include?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as MilestonePayload['status'])}>
          <option value="planned">Planned</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={mutation.isPending}>
            {initial ? 'Save Changes' : 'Create Milestone'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { isAdmin, user } = useAuthStore();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'tickets' | 'tasks'>('tickets');
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | undefined>();
  const [selectedMilestone, setSelectedMilestone] = useState<number | undefined>();

  // Shared filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  const hasActiveFilters = !!(search || statusFilter || priorityFilter || assigneeFilter);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setAssigneeFilter('');
  };

  const handleTabChange = (tab: 'tickets' | 'tasks') => {
    setActiveTab(tab);
    clearFilters();
  };

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId),
    enabled: !!projectId,
  });

  const { data: milestones, isLoading: milestonesLoading } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => projectsApi.listMilestones(projectId),
    enabled: !!projectId,
  });

  const { data: agents } = useQuery({
    queryKey: ['users', 'agents'],
    queryFn: adminApi.listUsers,
  });

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['tickets', { project_id: projectId, milestone_id: selectedMilestone, search, statusFilter, priorityFilter, assigneeFilter }],
    queryFn: () => ticketsApi.list({
      project_id: projectId,
      milestone_id: selectedMilestone,
      'filter[title]': search || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      assignee_id: assigneeFilter ? Number(assigneeFilter) : undefined,
      per_page: 50,
    }),
    enabled: !!projectId && activeTab === 'tickets',
    placeholderData: (prev) => prev,
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', { project_id: projectId, milestone_id: selectedMilestone, search, statusFilter, priorityFilter, assigneeFilter }],
    queryFn: () => tasksApi.list({
      project_id: projectId,
      milestone_id: selectedMilestone,
      'filter[title]': search || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      assignee_id: assigneeFilter ? Number(assigneeFilter) : undefined,
      per_page: 50,
    }),
    enabled: !!projectId && activeTab === 'tasks',
    placeholderData: (prev) => prev,
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: (milestoneId: number) => projectsApi.deleteMilestone(projectId, milestoneId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones', projectId] });
      if (selectedMilestone) setSelectedMilestone(undefined);
    },
  });

  const canManage = isAdmin() || project?.owner_id === user?.id;

  if (projectLoading) {
    return <div className="text-center py-16 text-gray-500">Loading project...</div>;
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Project not found.</p>
        <Link to="/projects" className="text-indigo-600 text-sm mt-2 block hover:underline">Back to Projects</Link>
      </div>
    );
  }

  const isLoading = activeTab === 'tickets' ? ticketsLoading : tasksLoading;
  const itemsData = activeTab === 'tickets' ? ticketsData : tasksData;
  const addTo = activeTab === 'tickets' ? '/tickets/new' : '/tasks/new';
  const addLabel = activeTab === 'tickets' ? 'Add Ticket' : 'Add Task';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/projects" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: project.color }}
          >
            {project.key.slice(0, 2)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-mono text-gray-400">{project.key}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {project.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {project.description && (
        <p className="text-sm text-gray-600">{project.description}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Milestones panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">Milestones</h3>
              {canManage && (
                <button
                  onClick={() => { setEditingMilestone(undefined); setShowMilestoneForm(true); }}
                  className="text-indigo-600 hover:text-indigo-800 transition-colors"
                  title="Add milestone"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            {milestonesLoading ? (
              <p className="text-xs text-gray-400 py-2">Loading...</p>
            ) : milestones?.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No milestones yet.</p>
            ) : (
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedMilestone(undefined)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !selectedMilestone ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All {activeTab}
                </button>
                {milestones?.map((m) => (
                  <div key={m.id} className="group">
                    <button
                      onClick={() => setSelectedMilestone(m.id === selectedMilestone ? undefined : m.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedMilestone === m.id
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {STATUS_ICON[m.status]}
                        <span className="truncate flex-1">{m.name}</span>
                      </div>
                      {m.due_date && (
                        <p className="text-xs text-gray-400 mt-0.5 ml-5">{formatDate(m.due_date)}</p>
                      )}
                      {typeof m.tickets_count === 'number' && m.tickets_count > 0 && (
                        <div className="mt-1.5 ml-5">
                          <div className="flex items-center justify-between text-xs text-gray-400 mb-0.5">
                            <span>{m.completed_tickets_count ?? 0}/{m.tickets_count} done</span>
                            <span>{m.progress ?? 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className="bg-indigo-500 h-1 rounded-full transition-all"
                              style={{ width: `${m.progress ?? 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </button>
                    {canManage && (
                      <div className="hidden group-hover:flex items-center gap-1 px-3 pb-1">
                        <button
                          onClick={() => { setEditingMilestone(m); setShowMilestoneForm(true); }}
                          className="text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete milestone "${m.name}"?`)) {
                              deleteMilestoneMutation.mutate(m.id);
                            }
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main panel */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Tab bar + action button */}
            <div className="flex items-center justify-between px-5 border-b border-gray-100">
              <div className="flex">
                <button
                  onClick={() => handleTabChange('tickets')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'tickets'
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  Tickets
                  <span className="ml-1.5 text-xs text-gray-400 font-normal">
                    ({activeTab === 'tickets' ? (ticketsData?.total ?? 0) : '—'})
                  </span>
                </button>
                <button
                  onClick={() => handleTabChange('tasks')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'tasks'
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  Tasks
                  <span className="ml-1.5 text-xs text-gray-400 font-normal">
                    ({activeTab === 'tasks' ? (tasksData?.total ?? 0) : '—'})
                  </span>
                </button>
              </div>
              <Link
                to={addTo}
                state={{ project_id: projectId, milestone_id: selectedMilestone }}
              >
                <Button size="sm">
                  <Plus size={14} />
                  {addLabel}
                </Button>
              </Link>
            </div>

            {/* Filter bar */}
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[160px]">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">All Assignees</option>
                {agents?.data?.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50 border border-gray-300"
                >
                  <X size={12} />
                  Clear
                </button>
              )}
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="text-center py-10 text-gray-500 text-sm">Loading {activeTab}...</div>
            ) : itemsData?.data.length === 0 ? (
              <div className="text-center py-10">
                <Flag size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">
                  {hasActiveFilters ? `No ${activeTab} match your filters.` : `No ${activeTab} in this view.`}
                </p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-indigo-600 text-xs mt-1 hover:underline">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {activeTab === 'tickets' ? 'Ticket' : 'Task'}
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Milestone</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {itemsData?.data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <Link
                          to={`/${activeTab}/${item.ulid}`}
                          className="font-medium text-gray-900 hover:text-indigo-600 transition-colors block"
                        >
                          {item.title}
                        </Link>
                        <span className="text-xs text-gray-400 font-mono">{item.ulid.slice(-8)}</span>
                      </td>
                      <td className="px-5 py-3"><StatusBadge status={item.status} /></td>
                      <td className="px-5 py-3"><PriorityBadge priority={item.priority} /></td>
                      <td className="px-5 py-3">
                        {item.assignees && item.assignees.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <div className="flex -space-x-1.5">
                              {item.assignees.slice(0, 2).map((a) => (
                                <Avatar key={a.id} src={a.avatar_url} name={a.name} size="sm" className="ring-2 ring-white" />
                              ))}
                            </div>
                            {item.assignees.length === 1 && (
                              <span className="text-sm text-gray-700 truncate max-w-[100px]">{item.assignees[0].name}</span>
                            )}
                            {item.assignees.length > 2 && (
                              <span className="text-xs text-gray-500">+{item.assignees.length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {item.milestone?.name ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{formatDate(item.due_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showMilestoneForm && (
        <MilestoneFormModal
          open={showMilestoneForm}
          onClose={() => { setShowMilestoneForm(false); setEditingMilestone(undefined); }}
          projectId={projectId}
          initial={editingMilestone}
        />
      )}
    </div>
  );
}
