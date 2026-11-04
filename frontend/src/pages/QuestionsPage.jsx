import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CircleHelp,
  Clock3,
  MessageSquareText,
  Plus,
  Search,
  Trash2,
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
import { questionService } from '../services/questionService';
import { excerpt, timeAgo } from '../utils/format';
import { getErrorMessage, getFieldErrors } from '../utils/apiError';

const EMPTY_FORM = { title: '', content: '' };

export default function QuestionsPage() {
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [meta, setMeta] = useState({ totalElements: 0, totalPages: 0, page: 0 });
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setPage(0);
  }, [search]);

  useEffect(() => {
    let active = true;
    async function loadQuestions() {
      setLoading(true);
      setError('');
      try {
        const result = await questionService.list({ search, page, size: 10 });
        if (!active) return;
        setQuestions(result.content);
        setMeta({ totalElements: result.totalElements, totalPages: result.totalPages, page: result.page });
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError, 'Unable to load questions.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadQuestions();
    return () => { active = false; };
  }, [search, page, refreshKey]);

  const openAsk = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleAsk = async (event) => {
    event.preventDefault();
    const next = {};
    if (form.title.trim().length < 5) next.title = 'Question title must be at least 5 characters';
    if (form.content.trim().length < 10) next.content = 'Add at least 10 characters of context';
    setFormErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await questionService.create(form);
      addToast('Question posted');
      setModalOpen(false);
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setFormErrors(getFieldErrors(requestError));
      addToast(getErrorMessage(requestError, 'Could not post the question.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (isAdmin && deleteTarget.author.id !== user.id) {
        await questionService.adminRemove(deleteTarget.id);
      } else {
        await questionService.remove(deleteTarget.id);
      }
      addToast('Question deleted');
      setDeleteTarget(null);
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      addToast(getErrorMessage(requestError, 'Could not delete the question.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Academic Q&A"
        title="Student Questions"
        description="Ask about subjects, exams or campus life and get answers from fellow students."
        actions={<Button onClick={openAsk}><Plus size={17} /> Ask a question</Button>}
      />

      <div className="toolbar">
        <div className="search-input">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search questions…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Search questions"
          />
        </div>
        <span className="toolbar-note">Be specific — clearer questions get better answers.</span>
      </div>

      {loading ? (
        <LoadingState message="Loading questions…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setRefreshKey((key) => key + 1)} />
      ) : questions.length === 0 ? (
        <EmptyState
          icon={CircleHelp}
          title={search ? 'No questions match your search' : 'No questions yet'}
          description={
            search
              ? 'Try a different topic or keyword.'
              : 'Ask the first academic question and start a useful discussion.'
          }
          action={
            search ? (
              <Button variant="secondary" onClick={() => setSearchInput('')}>Clear search</Button>
            ) : (
              <Button onClick={openAsk}><Plus size={16} /> Ask a question</Button>
            )
          }
        />
      ) : (
        <>
          <div className="question-list">
            {questions.map((question) => {
              const isOwner = question.author.id === user.id;
              return (
                <article className="question-card" key={question.id}>
                  <div className="question-votes" aria-label={`${question.answerCount} answers`}>
                    <strong>{question.answerCount}</strong>
                    <span>{question.answerCount === 1 ? 'answer' : 'answers'}</span>
                  </div>
                  <div className="question-main">
                    <div className="question-card-top">
                      <Link to={`/questions/${question.id}`}><h2>{question.title}</h2></Link>
                      {question.answerCount > 0 && <Badge variant="success">Answered</Badge>}
                    </div>
                    <p>{excerpt(question.content, 230)}</p>
                    <div className="question-card-meta">
                      <div className="author-inline">
                        <Avatar name={question.author.fullName} size="xs" />
                        <span>{question.author.fullName}</span>
                        <span>·</span>
                        <span>{question.author.department}</span>
                      </div>
                      <span className="meta-divider"><Clock3 size={13} /> {timeAgo(question.createdAt)}</span>
                    </div>
                  </div>
                  <div className="question-actions">
                    <Link to={`/questions/${question.id}`} className="text-link">
                      View <ArrowRight size={14} />
                    </Link>
                    {(isOwner || isAdmin) && (
                      <button
                        type="button"
                        className="icon-button danger"
                        onClick={() => setDeleteTarget(question)}
                        aria-label={`Delete ${question.title}`}
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
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Ask a question"
        description="Give enough context so other students can help."
        size="lg"
      >
        <form onSubmit={handleAsk} className="stack-form" noValidate>
          <FormField label="Question title" htmlFor="question-title" error={formErrors.title} required>
            <Input
              id="question-title"
              placeholder="What do you need help with?"
              value={form.title}
              maxLength={200}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              autoFocus
            />
          </FormField>
          <FormField label="Details" htmlFor="question-content" error={formErrors.content} required>
            <Textarea
              id="question-content"
              rows={7}
              placeholder="Explain the topic, what you have tried, and what kind of answer would help…"
              value={form.content}
              maxLength={10000}
              onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
            />
          </FormField>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" loading={saving}>
              <MessageSquareText size={16} /> Post question
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this question?"
        description="The question and all of its answers will be permanently removed."
      />
    </div>
  );
}
