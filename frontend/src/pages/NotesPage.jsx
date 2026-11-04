import { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Download,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Plus,
  Search,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { FormField, Input, Textarea } from '../components/FormControls';
import { ErrorState, LoadingState } from '../components/Loading';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { noteService } from '../services/noteService';
import { MAX_NOTE_SIZE, NOTE_ACCEPT } from '../utils/constants';
import { formatDate, formatFileSize, timeAgo } from '../utils/format';
import { getErrorMessage, getFieldErrors } from '../utils/apiError';

const EMPTY_FORM = { title: '', subject: '', description: '' };

function FileTypeIcon({ contentType }) {
  if (contentType?.startsWith('image/')) return <FileImage size={22} />;
  if (contentType?.includes('sheet') || contentType?.includes('excel')) return <FileSpreadsheet size={22} />;
  if (contentType?.includes('zip')) return <FileArchive size={22} />;
  return <FileText size={22} />;
}

export default function NotesPage() {
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [notes, setNotes] = useState([]);
  const [meta, setMeta] = useState({ totalElements: 0, totalPages: 0, page: 0 });
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    setPage(0);
  }, [search]);

  useEffect(() => {
    let active = true;
    async function loadNotes() {
      setLoading(true);
      setError('');
      try {
        const result = await noteService.list({ search, page, size: 12 });
        if (!active) return;
        setNotes(result.content);
        setMeta({ totalElements: result.totalElements, totalPages: result.totalPages, page: result.page });
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError, 'Unable to load study notes.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadNotes();
    return () => { active = false; };
  }, [search, page, refreshKey]);

  const openUpload = () => {
    setForm(EMPTY_FORM);
    setFile(null);
    setFormErrors({});
    setFileInputKey((key) => key + 1);
    setUploadOpen(true);
  };

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] || null;
    if (selected && selected.size > MAX_NOTE_SIZE) {
      setFile(null);
      setFormErrors((current) => ({ ...current, file: 'File is too large. Maximum size is 20 MB.' }));
      event.target.value = '';
      return;
    }
    setFile(selected);
    setFormErrors((current) => ({ ...current, file: undefined }));
  };

  const validateUpload = () => {
    const next = {};
    if (form.title.trim().length < 3) next.title = 'Title must be at least 3 characters';
    if (!form.subject.trim()) next.subject = 'Subject is required';
    if (!file) next.file = 'Select a file to upload';
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!validateUpload()) return;
    const data = new FormData();
    data.append('title', form.title.trim());
    data.append('subject', form.subject.trim());
    data.append('description', form.description.trim());
    data.append('file', file);

    setUploading(true);
    try {
      await noteService.upload(data);
      addToast('Study note uploaded');
      setUploadOpen(false);
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setFormErrors(getFieldErrors(requestError));
      addToast(getErrorMessage(requestError, 'Could not upload the study note.'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (note) => {
    setDownloadingId(note.id);
    try {
      await noteService.download(note);
    } catch (requestError) {
      addToast(getErrorMessage(requestError, 'Could not download this file.'), 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (isAdmin && deleteTarget.uploader.id !== user.id) {
        await noteService.adminRemove(deleteTarget.id);
      } else {
        await noteService.remove(deleteTarget.id);
      }
      addToast('Study note deleted');
      setDeleteTarget(null);
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      addToast(getErrorMessage(requestError, 'Could not delete the note.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Academic resources"
        title="Study Notes"
        description="Discover notes and academic files shared by students, or contribute your own material."
        actions={<Button onClick={openUpload}><Plus size={17} /> Upload notes</Button>}
      />

      <div className="toolbar">
        <div className="search-input">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by note title or subject…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Search study notes"
          />
        </div>
        <span className="toolbar-note">PDF, Word, PowerPoint, Excel, text and images · Max 20 MB</span>
      </div>

      {loading ? (
        <LoadingState message="Loading study notes…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setRefreshKey((key) => key + 1)} />
      ) : notes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={search ? 'No notes match your search' : 'No study notes yet'}
          description={
            search
              ? 'Try another title or subject.'
              : 'Be the first to share a useful resource with your classmates.'
          }
          action={
            search ? (
              <Button variant="secondary" onClick={() => setSearchInput('')}>Clear search</Button>
            ) : (
              <Button onClick={openUpload}><UploadCloud size={16} /> Upload a note</Button>
            )
          }
        />
      ) : (
        <>
          <div className="note-grid">
            {notes.map((note) => {
              const isOwner = note.uploader.id === user.id;
              return (
                <article className="note-card" key={note.id}>
                  <div className="note-card-top">
                    <span className="note-file-icon"><FileTypeIcon contentType={note.contentType} /></span>
                    <Badge variant="primary">{note.subject}</Badge>
                  </div>
                  <div className="note-card-body">
                    <h2>{note.title}</h2>
                    {note.description && <p>{note.description}</p>}
                  </div>
                  <div className="note-file-meta">
                    <span title={note.originalFilename}>{note.originalFilename}</span>
                    <span>{formatFileSize(note.fileSize)}</span>
                  </div>
                  <div className="note-uploader">
                    <Avatar name={note.uploader.fullName} size="xs" />
                    <div>
                      <strong>{note.uploader.fullName}</strong>
                      <span>{formatDate(note.createdAt)} · {timeAgo(note.createdAt)}</span>
                    </div>
                  </div>
                  <div className="note-card-actions">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDownload(note)}
                      loading={downloadingId === note.id}
                    >
                      <Download size={15} /> Download
                    </Button>
                    {(isOwner || isAdmin) && (
                      <button
                        type="button"
                        className="icon-button danger"
                        onClick={() => setDeleteTarget(note)}
                        aria-label={`Delete ${note.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
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
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload study material"
        description="Share academic files that other students can use."
        size="lg"
      >
        <form onSubmit={handleUpload} className="stack-form" noValidate>
          <div className="form-row">
            <FormField label="Title" htmlFor="note-title" error={formErrors.title} required>
              <Input
                id="note-title"
                placeholder="e.g. Data Structures Unit 3 notes"
                value={form.title}
                maxLength={200}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                autoFocus
              />
            </FormField>
            <FormField label="Subject" htmlFor="note-subject" error={formErrors.subject} required>
              <Input
                id="note-subject"
                placeholder="e.g. Data Structures"
                value={form.subject}
                maxLength={120}
                onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
              />
            </FormField>
          </div>
          <FormField label="Description" htmlFor="note-description" error={formErrors.description}>
            <Textarea
              id="note-description"
              rows={3}
              placeholder="Briefly describe what the file covers (optional)"
              value={form.description}
              maxLength={2000}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </FormField>
          <FormField
            label="Academic file"
            htmlFor="note-file"
            error={formErrors.file}
            hint="PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, TXT, PNG or JPG · Max 20 MB"
            required
          >
            <div
              className={`file-drop ${file ? 'file-drop-selected' : ''}`}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') fileRef.current?.click();
              }}
              role="button"
              tabIndex={0}
            >
              <UploadCloud size={23} />
              {file ? (
                <div>
                  <strong>{file.name}</strong>
                  <span>{formatFileSize(file.size)} · Ready to upload</span>
                </div>
              ) : (
                <div>
                  <strong>Choose a file</strong>
                  <span>Click to browse from your device</span>
                </div>
              )}
            </div>
            <input
              key={fileInputKey}
              id="note-file"
              ref={fileRef}
              type="file"
              accept={NOTE_ACCEPT}
              onChange={handleFileChange}
              className="visually-hidden"
            />
          </FormField>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setUploadOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button type="submit" loading={uploading}>
              <UploadCloud size={16} /> Upload note
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this study note?"
        description="The file and its metadata will be permanently deleted."
      />
    </div>
  );
}
