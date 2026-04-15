import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Edit, Trash2, Paperclip,
  MessageSquare, History, ChevronDown, X, FileText, Image,
} from 'lucide-react';
import { ticketsApi } from '@/api/tickets';
import { commentsApi } from '@/api/comments';
import { categoriesApi } from '@/api/categories';
import { labelsApi } from '@/api/labels';
import { Button } from '@/components/ui/Button';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { formatDate, formatDateTime, formatRelative } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';
import client from '@/api/client';

const TABS = ['Comments', 'Attachments', 'History'] as const;
type Tab = typeof TABS[number];

export function TicketDetailPage() {
  const { ulid } = useParams<{ ulid: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, isAdmin } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('Comments');
  const [commentBody, setCommentBody] = useState('');
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [commentModal, setCommentModal] = useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  // time log
  const [logHours, setLogHours] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  // ticket fields editable via comment
  const [cmtStatus, setCmtStatus] = useState('');
  const [cmtPriority, setCmtPriority] = useState('');
  const [cmtLabelId, setCmtLabelId] = useState('');
  const [cmtCategoryId, setCmtCategoryId] = useState('');
  const [cmtDueDate, setCmtDueDate] = useState('');
  const [cmtProgress, setCmtProgress] = useState('');
  // status quick-change modal
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', ulid],
    queryFn: () => ticketsApi.get(ulid!),
  });

  const { data: labels } = useQuery({ queryKey: ['labels'], queryFn: labelsApi.list });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });

  // Initialise comment modal fields from current ticket when modal opens
  useEffect(() => {
    if (commentModal && ticket) {
      setCmtStatus(ticket.status);
      setCmtPriority(ticket.priority);
      setCmtLabelId(ticket.label_id ? String(ticket.label_id) : '');
      setCmtCategoryId(ticket.category_id ? String(ticket.category_id) : '');
      setCmtDueDate(ticket.due_date ?? '');
      setCmtProgress(String(ticket.progress ?? 0));
    }
  }, [commentModal]);

  const { data: comments } = useQuery({
    queryKey: ['comments', ulid],
    queryFn: () => commentsApi.list(ulid!),
    enabled: activeTab === 'Comments',
  });

  const { data: history } = useQuery({
    queryKey: ['history', ulid],
    queryFn: () => ticketsApi.history(ulid!),
    enabled: activeTab === 'History',
  });

  const handleCommentSubmit = async () => {
    const hasComment = commentBody.trim() || commentFiles.length > 0;
    const hasTimeLog = logHours && parseFloat(logHours) > 0;
    if (!hasComment && !hasTimeLog) return;
    setIsCommentSubmitting(true);
    try {
      const minutes = hasTimeLog ? Math.round(parseFloat(logHours) * 60) : undefined;
      await commentsApi.create(
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
      qc.invalidateQueries({ queryKey: ['comments', ulid] });
      qc.invalidateQueries({ queryKey: ['ticket', ulid] });
      setCommentBody('');
      setCommentFiles([]);
      setLogHours('');
      setCommentModal(false);
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const statusMutation = useMutation({
    mutationFn: () => ticketsApi.changeStatus(ulid!, newStatus),
    onSuccess: () => { setStatusModal(false); qc.invalidateQueries({ queryKey: ['ticket', ulid] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: () => ticketsApi.delete(ulid!),
    onSuccess: () => navigate('/tickets'),
  });

  if (isLoading) return <div className="text-center py-20 text-gray-500">Loading ticket...</div>;
  if (!ticket) return <div className="text-center py-20 text-red-500">Ticket not found.</div>;

  const canEdit = isAdmin() || ticket.reporter_id === user?.id || ticket.assignees?.some((a) => a.id === user?.id);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/tickets" className="text-gray-400 hover:text-gray-600 mt-1">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-2xl font-bold text-gray-900">{ticket.title}</h2>
            <div className="flex items-center gap-2 flex-shrink-0">
              {canEdit && (
                <Link to={`/tickets/${ulid}/edit`}>
                  <Button variant="outline" size="sm"><Edit size={14} /> Edit</Button>
                </Link>
              )}
              {(isAdmin() || ticket.reporter_id === user?.id) && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => { if (confirm('Delete this ticket?')) deleteMutation.mutate(); }}
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-1">{ticket.ulid}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
            {ticket.description ? (
              <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{ticket.description}</p>
            ) : (
              <p className="text-gray-400 text-sm italic">No description provided.</p>
            )}
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                  {tab === 'Comments' && comments && ` (${comments.length})`}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Comments tab */}
              {activeTab === 'Comments' && (
                <div className="space-y-4">
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
                        {/* Comment attachments */}
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
                              {reply.attachments && reply.attachments.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {reply.attachments.map((att) =>
                                    att.is_image ? (
                                      <a key={att.id} href={att.url} target="_blank" rel="noreferrer">
                                        <img
                                          src={att.url}
                                          alt={att.filename}
                                          className="max-h-32 max-w-[200px] rounded-lg border border-gray-200 object-cover"
                                        />
                                      </a>
                                    ) : (
                                      <a
                                        key={att.id}
                                        href={att.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs hover:bg-gray-50"
                                      >
                                        <FileText size={12} className="text-indigo-500" />
                                        <span className="text-gray-700 truncate max-w-[140px]">{att.filename}</span>
                                        <span className="text-gray-400">{att.human_size}</span>
                                      </a>
                                    )
                                  )}
                                </div>
                              )}
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
              )}

              {/* Attachments tab */}
              {activeTab === 'Attachments' && (
                <div className="space-y-2">
                  {ticket.attachments?.map((att) => (
                    <div key={att.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <Paperclip size={16} className="text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{att.filename}</p>
                        <p className="text-xs text-gray-400">{att.human_size}</p>
                      </div>
                      <a href={att.url} target="_blank" rel="noreferrer" className="text-indigo-600 text-sm hover:underline">
                        Download
                      </a>
                    </div>
                  ))}
                  {(ticket.attachments?.length ?? 0) === 0 && (
                    <p className="text-gray-400 text-sm text-center py-8">No attachments yet.</p>
                  )}
                  <div className="mt-4">
                    <input
                      type="file"
                      id="attachment-upload"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append('file', file);
                        await client.post(`/tickets/${ulid}/attachments`, fd, {
                          headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        qc.invalidateQueries({ queryKey: ['ticket', ulid] });
                      }}
                    />
                    <label htmlFor="attachment-upload">
                      <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('attachment-upload')?.click()}>
                        <Paperclip size={14} /> Upload File
                      </Button>
                    </label>
                  </div>
                </div>
              )}

              {/* History tab */}
              {activeTab === 'History' && (
                <div className="space-y-3">
                  {history?.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-sm">
                      <Avatar src={log.user?.avatar_url} name={log.user?.name ?? '?'} size="sm" />
                      <div>
                        <span className="font-medium text-gray-900">{log.user?.name}</span>
                        {' '}
                        <span className="text-gray-600">{log.event.replace('_', ' ')}</span>
                        {log.new_values && (
                          <span className="text-gray-500"> → {JSON.stringify(log.new_values)}</span>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">{formatRelative(log.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Status</p>
              <div className="flex items-center gap-2">
                <StatusBadge status={ticket.status} />
                {canEdit && (
                  <button
                    onClick={() => { setNewStatus(ticket.status); setStatusModal(true); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ChevronDown size={14} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Priority</p>
              <PriorityBadge priority={ticket.priority} />
            </div>

            {ticket.label && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Label</p>
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ backgroundColor: ticket.label.color + '20', color: ticket.label.color }}
                >
                  {ticket.label.name}
                </span>
              </div>
            )}

            {ticket.category && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Type</p>
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ backgroundColor: ticket.category.color + '20', color: ticket.category.color }}
                >
                  {ticket.category.name}
                </span>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Reporter</p>
              <div className="flex items-center gap-2">
                <Avatar src={ticket.reporter.avatar_url} name={ticket.reporter.name} size="sm" />
                <span className="text-sm text-gray-700">{ticket.reporter.name}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Assignees</p>
              {ticket.assignees && ticket.assignees.length > 0 ? (
                <div className="space-y-2">
                  {ticket.assignees.map((a) => (
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

            {ticket.partner && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Partner</p>
                <div>
                  <p className="text-sm font-medium text-gray-900">{ticket.partner.name}</p>
                  {ticket.partner.company && (
                    <p className="text-xs text-gray-500">{ticket.partner.company}</p>
                  )}
                  {ticket.partner.email && (
                    <a href={`mailto:${ticket.partner.email}`} className="text-xs text-indigo-600 hover:underline">
                      {ticket.partner.email}
                    </a>
                  )}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Due Date</p>
              <p className="text-sm text-gray-700">{formatDate(ticket.due_date)}</p>
            </div>

            {ticket.estimated_hours && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Estimated</p>
                <p className="text-sm text-gray-700">{ticket.estimated_hours}h</p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Progress</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${ticket.progress ?? 0}%` }} />
                </div>
                <span className="text-xs text-gray-600 font-medium">{ticket.progress ?? 0}%</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Time Logged</p>
              <p className="text-sm text-gray-700">{ticket.total_hours_logged ? `${ticket.total_hours_logged}h` : '—'}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Created</p>
              <p className="text-sm text-gray-700">{formatDateTime(ticket.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Combined Comment + Ticket Update Modal */}
      <Modal open={commentModal} onClose={() => setCommentModal(false)} title="Add Comment">
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">

          {/* Ticket fields */}
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
              id="modal-comment-file-input"
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
              onClick={() => document.getElementById('modal-comment-file-input')?.click()}
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
