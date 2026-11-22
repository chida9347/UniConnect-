import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock3,
  ImagePlus,
  MessagesSquare,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { FormField, Input, Select, Textarea } from '../components/FormControls';
import { ErrorState, LoadingState } from '../components/Loading';
import PostImage from '../components/PostImage';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { postService } from '../services/postService';
import { POST_IMAGE_ACCEPT } from '../utils/constants';
import { excerpt, timeAgo } from '../utils/format';
import { getErrorMessage, getFieldErrors } from '../utils/apiError';
import { validatePostImages } from '../utils/upload';

const EMPTY_FORM = { title: '', content: '' };

export default function PostsPage() {
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState({ totalElements: 0, totalPages: 0, page: 0 });
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [newImages, setNewImages] = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [imageError, setImageError] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const previewUrls = useMemo(() => newImages.map((file) => URL.createObjectURL(file)), [newImages]);

  useEffect(() => () => previewUrls.forEach((url) => URL.revokeObjectURL(url)), [previewUrls]);

  useEffect(() => {
    setPage(0);
  }, [search, sort]);

  useEffect(() => {
    let active = true;
    async function loadPosts() {
      setLoading(true);
      setError('');
      try {
        const result = await postService.list({ search, page, size: 10, sort });
        if (!active) return;
        setPosts(result.content);
        setMeta({
          totalElements: result.totalElements,
          totalPages: result.totalPages,
          page: result.page,
        });
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError, 'Unable to load student posts.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadPosts();
    return () => {
      active = false;
    };
  }, [search, page, sort, refreshKey]);

  const resetImages = () => {
    setNewImages([]);
    setRemovedImageIds([]);
    setImageError('');
    setLightbox(null);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    resetImages();
    setModalOpen(true);
  };

  const openEdit = (post) => {
    setEditing(post);
    setForm({ title: post.title, content: post.content });
    setFormErrors({});
    resetImages();
    setModalOpen(true);
  };

  const handleImagesChange = (event) => {
    const picked = Array.from(event.target.files || []);
    const combined = [...newImages, ...picked];
    const existingCount = editing?.images?.filter((image) => !removedImageIds.includes(image.id)).length || 0;
    const error = validatePostImages(combined, existingCount);
    event.target.value = '';
    if (error) {
      setImageError(error);
      addToast(error, 'error');
      return;
    }
    setNewImages(combined);
    setImageError('');
  };

  const toggleExistingImage = (imageId) => {
    setRemovedImageIds((current) => current.includes(imageId)
      ? current.filter((id) => id !== imageId)
      : [...current, imageId]);
  };

  const validate = () => {
    const next = {};
    if (form.title.trim().length < 3) next.title = 'Title must be at least 3 characters';
    if (form.title.trim().length > 180) next.title = 'Title cannot exceed 180 characters';
    if (form.content.trim().length < 10) next.content = 'Content must be at least 10 characters';
    if (form.content.trim().length > 10000) next.content = 'Content cannot exceed 10,000 characters';
    if (imageError) next.images = imageError;
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        images: newImages,
        removedImageIds: editing ? removedImageIds : [],
      };
      if (editing) {
        await postService.update(editing.id, payload);
        addToast('Post updated');
      } else {
        await postService.create(payload);
        addToast('Post published');
      }
      setModalOpen(false);
      resetImages();
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setFormErrors(getFieldErrors(requestError));
      addToast(getErrorMessage(requestError, 'Could not save the post.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (isAdmin && deleteTarget.author.id !== user.id) {
        await postService.adminRemove(deleteTarget.id);
      } else {
        await postService.remove(deleteTarget.id);
      }
      addToast('Post deleted');
      setDeleteTarget(null);
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      addToast(getErrorMessage(requestError, 'Could not delete the post.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Student community"
        title="Student Posts"
        description="Ask for advice, share campus updates and start conversations with your peers."
        actions={
          <Button onClick={openCreate}>
            <Plus size={17} /> Create post
          </Button>
        }
      />

      <div className="toolbar">
        <div className="search-input">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search posts by title or content…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Search student posts"
          />
        </div>
        <Select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          aria-label="Sort posts"
          className="toolbar-select"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </Select>
      </div>

      {loading ? (
        <LoadingState message="Loading posts…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setRefreshKey((key) => key + 1)} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title={search ? 'No posts match your search' : 'Start the first conversation'}
          description={
            search
              ? 'Try a different keyword or clear the search.'
              : 'Share a question, a useful update or something the student community should know.'
          }
          action={
            search ? (
              <Button variant="secondary" onClick={() => setSearchInput('')}>Clear search</Button>
            ) : (
              <Button onClick={openCreate}><Plus size={16} /> Create post</Button>
            )
          }
        />
      ) : (
        <>
          <div className="post-list">
            {posts.map((post) => {
              const isOwner = post.author.id === user.id;
              return (
                <article className="post-card" key={post.id}>
                  <div className="post-card-header">
                    <div className="author-row">
                      <Avatar name={post.author.fullName} size="sm" />
                      <div>
                        <strong>{post.author.fullName}</strong>
                        <span>
                          {post.author.department}
                          {post.author.role === 'ADMIN' && <Badge variant="warning">Admin</Badge>}
                        </span>
                      </div>
                    </div>
                    <div className="post-meta">
                      <Clock3 size={14} />
                      <span>{timeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                  <div className="post-card-body">
                    <Link to={`/posts/${post.id}`}><h2>{post.title}</h2></Link>
                    <p>{excerpt(post.content, 260)}</p>
                  </div>
                  {post.images?.length > 0 && (
                    <div className="post-image-strip">
                      {post.images.map((image) => (
                        <PostImage
                          key={image.id}
                          image={image}
                          className="post-image-thumb"
                          onClick={() => setLightbox(image)}
                        />
                      ))}
                    </div>
                  )}
                  <div className="post-card-footer">
                    <Link to={`/posts/${post.id}`} className="text-link">
                      Read discussion <ArrowRight size={14} />
                    </Link>
                    {(isOwner || isAdmin) && (
                      <div className="card-actions">
                        {isOwner && (
                          <button type="button" className="action-button" onClick={() => openEdit(post)}>
                            <Pencil size={14} /> Edit
                          </button>
                        )}
                        <button
                          type="button"
                          className="action-button action-danger"
                          onClick={() => setDeleteTarget(post)}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            totalElements={meta.totalElements}
            onPageChange={setPage}
          />
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit post' : 'Create a post'}
        description={editing ? 'Update your discussion.' : 'Share something useful with the student community.'}
        size="lg"
      >
        <form onSubmit={handleSave} className="stack-form" noValidate>
          <FormField label="Title" htmlFor="post-title" error={formErrors.title} required>
            <Input
              id="post-title"
              placeholder="What would you like to discuss?"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              maxLength={180}
              autoFocus
            />
          </FormField>
          <FormField
            label="Content"
            htmlFor="post-content"
            error={formErrors.content}
            hint={`${form.content.length}/10,000 characters`}
            required
          >
            <Textarea
              id="post-content"
              rows={8}
              placeholder="Add context, details or your question…"
              value={form.content}
              onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
              maxLength={10000}
            />
          </FormField>
          <FormField
            label="Images (optional)"
            htmlFor="post-images"
            error={imageError}
            hint="Up to 4 images · PNG, JPG, GIF or WebP · 5 MB each"
          >
            <label className="image-picker" htmlFor="post-images">
              <ImagePlus size={18} /> Add images to this post
            </label>
            <input
              key={`${editing?.id || 'new'}-images`}
              id="post-images"
              type="file"
              accept={POST_IMAGE_ACCEPT}
              multiple
              onChange={handleImagesChange}
              className="visually-hidden"
              disabled={saving}
            />
          </FormField>
          {(previewUrls.length > 0 || editing?.images?.some((image) => !removedImageIds.includes(image.id))) && (
            <div className="post-image-previews">
              {editing?.images
                ?.filter((image) => !removedImageIds.includes(image.id))
                .map((image) => (
                  <div className="image-preview-item" key={image.id}>
                    <PostImage image={image} className="image-preview-img" />
                    <button
                      type="button"
                      className="image-preview-remove"
                      onClick={() => toggleExistingImage(image.id)}
                      aria-label={`Remove ${image.originalFilename}`}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              {previewUrls.map((url, index) => (
                <div className="image-preview-item" key={url}>
                  <img src={url} alt={newImages[index].name} className="image-preview-img" />
                  <button
                    type="button"
                    className="image-preview-remove"
                    onClick={() => setNewImages((current) => current.filter((_, i) => i !== index))}
                    aria-label={`Remove ${newImages[index].name}`}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Save changes' : 'Publish post'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(lightbox)}
        onClose={() => setLightbox(null)}
        title={lightbox?.originalFilename || 'Post image'}
        size="lg"
      >
        {lightbox && <PostImage image={lightbox} className="lightbox-image" />}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this post?"
        description="The post and its content will be permanently removed. This cannot be undone."
      />
    </div>
  );
}
