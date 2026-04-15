import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Edit, Trash2, ChevronDown,
  MessageSquare, Paperclip, FileText, Image, X,
} from 'lucide-react';
import { tasksApi } from '@/api/tasks';
import { taskCommentsApi } from '@/api/comments';
import { categoriesApi } from '@/api/categories';
import { labelsApi } from '@/api/labels';
import { Button } from '@/components/ui/Button';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { formatDate, formatDateTime, formatRelative } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';

export function TaskDetailPage() {
  const { ulid } = useParams<{ ulid: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, isAdmin } = useAuthStore();

  // comment modal state
  const [commentModal, setCommentModal] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [logHours, setLogHours] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  // task fields editable via comment
  const [cmtStatus, setCmtStatus] = useState('');
  const [cmtPriority, setCmtPriority] = useState('');
  const [cmtLabelId, setCmtLabelId] = useState('');
  const [cmtCategoryId, setCmtCategoryId] = useState('');
  const [cmtDueDate, setCmtDueDate] = useState('');
  const [cmtProgress, setCmtProgress] = useState('');
  // status quick-change modal
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', ulid],
    queryFn: () => tasksApi.get(ulid!),
  });

  const { data: labels } = useQuery({ queryKey: ['labels'], queryFn: labelsApi.list });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });

  const { data: comments } = useQuery({
    queryKey: ['task-comments', ulid],
    queryFn: () => taskCommentsApi.list(ulid!),
  });

  useEffect(() => {
    if (commentModal && task) {
      setCmtStatus(task.status);
      setCmtPriority(task.priority);
      setCmtLabelId(task.label_id ? String(task.label_id) : '');
      setCmtCategoryId(task.category_id ? String(task.category_id) : '');
      setCmtDueDate(task.due_date ?? '');
      setCmtProgress(String(task.progress ?? 0));
    }
  }, [commentModal]);

  const handleCommentSubmit = async () => {
    const hasComment = commentBody.trim() || commentFiles.length > 0;
    const hasTimeLog = logHours && parseFloat(logHours) > 0;
    if (!hasComment && !hasTimeLog) return;
    setIsCommentSubmitting(true);
    try {
      const minutes = hasTimeLog ? Math.round(parseFloat(logHours) * 60) : undefined;
      await taskCommentsApi.create(
        ulid!,
        {
          body: commentBody,
          minutes,
          logged_date: minutes ? logDate : undefined,
          status: cmtStatus || undefined,
          priority: cmtPriority || undefined,
          label_id: cmtLabelId ? Number(cmtLabelId) : undefined,
          category_id: cmtCategoryId ? Number(cmtCategoryId) : undefined,
          due_date: cmtDueDate || undefined,
          progress: cmtProgress !== '' ? Number(cmtProgress) : undefined,
        },
        commentFiles,
      );
      qc.invalidateQueries({ queryKey: ['task-comments', ulid] });
      qc.invalidateQueries({ queryKey: ['task', ulid] });
      setCommentBody('');
      setCommentFiles([]);
      setLogHours('');
      setCommentModal(false);
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const statusMutation = useMutation({
    mutationFn: () => tasksApi.changeStatus(ulid!, newStatus),
    onSuccess: () => { setStatusModal(false); qc.invalidateQueries({ queryKey: ['task', ulid] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(ulid!),
    onSuccess: () => navigate('/tasks'),
  });

  if (isLoading) return <div className="text-center py-20 text-gray-500">Loading task...</div>;
  if (!task) return <div className="text-center py-20 text-red-500">Task not found.</div>;

  const canEdit = isAdmin() || task.reporter_id === user?.id || task.assignees?.some((a) => a.id === user?.id);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/tasks" className="text-gray-400 hover:text-gray-600 mt-1">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
            <div className="flex items-center gap-2 flex-shrink-0">
              {canEdit && (
                <Link to={`/tasks/${ulid}/edit`}>
                  <Button variant="outline" size="sm"><Edit size={14} /> Edit</Button>
                </Link>
              )}
              {(isAdmin() || task.reporter_id === user?.id) && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => { if (confirm('Delete this task?')) deleteMutation.mutate(); }}
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-1">{task.ulid}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
            {task.description ? (
              <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{task.description}</p>
            ) : (
              <p className="text-gray-400 text-sm italic">No description provided.</p>
            )}
          </div>

          {/* Comments */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">
                Comments {comments ? `(${comments.length})` : ''}
              </span>
            </div>

            <div className="p-6 space-y-4">
              {comments?.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar src={comment.user.avatar_url} name={comment.user.name} size="sm" />
                  <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">{comment.user.name}</span>
                      <span className="text-xs text-gray-400">{formatRelative(comment.created_at)}</span>
                    </div>
                    {comment.body && (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.body}</p>
                    )}
                    {comment.logged_hours != null && (
                      <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
                        <li>Work Hours: {comment.logged_hours}</li>
                      </ul>
                    )}
                    {comment.attachments && comment.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {comment.attachments.map((att) =>
                          att.is_image ? (
                            <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="block">
                              <img
                                src={att.url}
                                alt={att.filename}
                                className="max-h-40 max-w-xs rounded-lg border border-gray-200 object-cover hover:opacity-90 transition-opacity"
                              />
                              <span className="text-xs text-gray-400 mt-0.5 block">{att.human_size}</span>
                            </a>
                          ) : (
                            <a
                              key={att.id}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                            >
                              <FileText size={14} className="text-indigo-500 flex-shrink-0" />
                              <span className="text-gray-700 truncate max-w-[160px]">{att.filename}</span>
                              <span className="text-xs text-gray-400 flex-shrink-0">{att.human_size}</span>
                            </a>
                          )
                        )}
                      </div>
                    )}
                    {comment.replies?.map((reply) => (
                      <div key={reply.id} className="mt-3 pl-4 border-l-2 border-gray-200 flex gap-3">
                        <Avatar src={reply.user.avatar_url} name={reply.user.name} size="sm" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-gray-900">{reply.user.name}</span>
                            <span className="text-xs text-gray-400">{formatRelative(reply.created_at)}</span>
                          </div>
                          {reply.body && <p className="text-sm text-gray-700">{reply.body}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Add comment button */}
              <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                <Avatar src={user?.avatar_url} name={user?.name ?? ''} size="sm" />
                <button
                  onClick={() => setCommentModal(true)}
                  className="flex-1 text-left text-sm text-gray-400 border border-gray-200 rounded-lg px-4 py-2.5 hover:border-indigo-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-white cursor-text"
                >
                  Add a comment or log time...
                </button>
                <Button size="sm" onClick={() => setCommentModal(true)}>
                  <MessageSquare size={14} /> Add Comment
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Status</p>
              <div className="flex items-center gap-2">
                <StatusBadge status={task.status} />
                {canEdit && (
                  <button
                    onClick={() => { setNewStatus(task.status); setStatusModal(true); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ChevronDown size={14} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Priority</p>
              <PriorityBadge priority={task.priority} />
            </div>

            {task.label && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Label</p>
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ backgroundColor: task.label.color + '20', color: task.label.color }}
                >
                  {task.label.name}
                </span>
              </div>
            )}

            {task.category && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Type</p>
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ backgroundColor: task.category.color + '20', color: task.category.color }}
                >
                  {task.category.name}
                </span>
              </div>
            )}

            {task.project && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Project</p>
                <Link
                  to={`/projects/${task.project.id}`}
                  className="text-sm font-medium hover:text-indigo-600 transition-colors"
                  style={{ color: task.project.color }}
                >
                  [{task.project.key}] {task.project.name}
                </Link>
              </div>
            )}

            {task.milestone && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Milestone</p>
                <p className="text-sm text-gray-700">{task.milestone.name}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Reporter</p>
              <div className="flex items-center gap-2">
                <Avatar src={task.reporter.avatar_url} name={task.reporter.name} size="sm" />
                <span className="text-sm text-gray-700">{task.reporter.name}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Assignees</p>
              {task.assignees && task.assignees.length > 0 ? (
                <div className="space-y-2">
                  {task.assignees.map((a) => (
                    <div key={a.id} className="flex items-center gap-2">
                      <Avatar src={a.avatar_url} name={a.name} size="sm" />
                      <span className="text-sm text-gray-700">{a.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-gray-400">Unassigned</span>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Due Date</p>
              <p className="text-sm text-gray-700">{formatDate(task.due_date)}</p>
            </div>

            {task.estimated_hours && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Estimated</p>
                <p className="text-sm text-gray-700">{task.estimated_hours}h</p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Progress</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${task.progress ?? 0}%` }} />
                </div>
                <span className="text-xs text-gray-600 font-medium">{task.progress ?? 0}%</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Created</p>
              <p className="text-sm text-gray-700">{formatDateTime(task.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Comment Modal */}
      <Modal open={commentModal} onClose={() => setCommentModal(false)} title="Add Comment">
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">

          {/* Task fields */}
          <div className="grid grid-cols-2 gap-3">
            <Select label="Status" value={cmtStatus} onChange={(e) => setCmtStatus(e.target.value)}>
              <option value="">— no change —</option>
              {['open', 'in_progress', 'in_review', 'resolved', 'closed'].map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
              ))}
            </Select>

            <Select label="Priority" value={cmtPriority} onChange={(e) => setCmtPriority(e.target.value)}>
              <option value="">— no change —</option>
              {['low', 'medium', 'high', 'critical'].map((p) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </Select>

            <Select label="Label" value={cmtLabelId} onChange={(e) => setCmtLabelId(e.target.value)}>
              <option value="">— no change —</option>
              {labels?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>

            <Select label="Type" value={cmtCategoryId} onChange={(e) => setCmtCategoryId(e.target.value)}>
              <option value="">— no change —</option>
              {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>

            <Input
              label="Due Date"
              type="date"
              value={cmtDueDate}
              onChange={(e) => setCmtDueDate(e.target.value)}
            />

            <Select label="Progress" value={cmtProgress} onChange={(e) => setCmtProgress(e.target.value)}>
              {[0, 10, 25, 50, 75, 90, 100].map((p) => (
                <option key={p} value={p}>{p}%</option>
              ))}
            </Select>
          </div>

          {/* Time log */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Work Hours"
              type="number"
              min="0"
              step="0.25"
              placeholder="e.g. 1.5"
              value={logHours}
              onChange={(e) => setLogHours(e.target.value)}
            />
            <Input
              label="Log Date"
              type="date"
              value={logDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setLogDate(e.target.value)}
            />
          </div>

          {/* Comment body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              rows={4}
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Describe what was done, any blockers, or notes..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Attached file chips */}
          {commentFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {commentFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs px-2 py-1 rounded-full">
                  {file.type.startsWith('image/') ? <Image size={11} /> : <FileText size={11} />}
                  <span className="max-w-[140px] truncate">{file.name}</span>
                  <button type="button" onClick={() => setCommentFiles((prev) => prev.filter((_, idx) => idx !== i))} className="hover:text-red-500 transition-colors">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={handleCommentSubmit}
              loading={isCommentSubmitting}
              disabled={!commentBody.trim() && commentFiles.length === 0 && !(logHours && parseFloat(logHours) > 0)}
            >
              Post
            </Button>
            <input
              id="task-comment-file-input"
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.csv"
              className="hidden"
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                setCommentFiles((prev) => [...prev, ...picked]);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => document.getElementById('task-comment-file-input')?.click()}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors px-3 py-1.5 border border-gray-300 rounded-lg hover:border-indigo-400"
            >
              <Paperclip size={13} /> Attach Files
            </button>
            <Button variant="outline" onClick={() => setCommentModal(false)} className="ml-auto">Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Change Status Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Change Status">
        <div className="space-y-4">
          <Select label="New Status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
            {['open', 'in_progress', 'in_review', 'resolved', 'closed'].map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </Select>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => statusMutation.mutate()} loading={statusMutation.isPending}>Update Status</Button>
            <Button variant="outline" onClick={() => setStatusModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
