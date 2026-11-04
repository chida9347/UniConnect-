import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Pencil,
  Trash2,
} from 'lucide-react';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import { FormField, Input, Textarea } from '../components/FormControls';
import { ErrorState, LoadingState } from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { postService } from '../services/postService';
import { formatDateTime } from '../utils/format';
import { getErrorMessage, getFieldErrors } from '../utils/apiError';

export default function PostDetailPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await postService.get(id);
      setPost(result);
      setForm({ title: result.title, content: result.content });
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load this post.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const isOwner = post?.author?.id === user?.id;

  const handleSave = async (event) => {
    event.preventDefault();
    const next = {};
    if (form.title.trim().length < 3) next.title = 'Title must be at least 3 characters';
    if (form.content.trim().length < 10) next.content = 'Content must be at least 10 characters';
    setFormErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      const updated = await postService.update(post.id, form);
      setPost(updated);
      setEditOpen(false);
      addToast('Post updated');
    } catch (requestError) {
      setFormErrors(getFieldErrors(requestError));
      addToast(getErrorMessage(requestError, 'Could not update the post.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (isAdmin && !isOwner) await postService.adminRemove(post.id);
      else await postService.remove(post.id);
      addToast('Post deleted');
      navigate('/posts', { replace: true });
    } catch (requestError) {
      addToast(getErrorMessage(requestError, 'Could not delete the post.'), 'error');
      setDeleting(false);
    }
  };

  if (loading) return <LoadingState message="Loading discussion…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!post) return null;

  return (
    <div className="detail-page">
      <Link to="/posts" className="back-link"><ArrowLeft size={16} /> Back to student posts</Link>

      <article className="detail-card">
        <div className="detail-author">
          <Avatar name={post.author.fullName} />
          <div>
            <div className="detail-author-name">
              <strong>{post.author.fullName}</strong>
              {post.author.role === 'ADMIN' && <Badge variant="warning">Admin</Badge>}
            </div>
            <span>{post.author.universityId} · {post.author.department}</span>
          </div>
          <div className="detail-date">
            <CalendarDays size={14} />
            {formatDateTime(post.createdAt)}
          </div>
        </div>

        <div className="detail-body">
          <h1>{post.title}</h1>
          <p className="detail-content">{post.content}</p>
        </div>

        <div className="detail-footer">
          <span className="detail-updated">
            <Clock3 size={14} />
            {post.updatedAt !== post.createdAt ? `Edited ${formatDateTime(post.updatedAt)}` : 'Posted'}
          </span>
          {(isOwner || isAdmin) && (
            <div className="card-actions">
              {isOwner && (
                <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil size={15} /> Edit post
                </Button>
              )}
              <Button variant="danger-ghost" size="sm" onClick={() => setConfirmOpen(true)}>
                <Trash2 size={15} /> Delete
              </Button>
            </div>
          )}
        </div>
      </article>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit post" size="lg">
        <form onSubmit={handleSave} className="stack-form" noValidate>
          <FormField label="Title" htmlFor="detail-post-title" error={formErrors.title} required>
            <Input
              id="detail-post-title"
              value={form.title}
              maxLength={180}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
          </FormField>
          <FormField label="Content" htmlFor="detail-post-content" error={formErrors.content} required>
            <Textarea
              id="detail-post-content"
              rows={8}
              value={form.content}
              maxLength={10000}
              onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
            />
          </FormField>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" loading={saving}>Save changes</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this post?"
        description="This discussion will be permanently removed from the community."
      />
    </div>
  );
}
