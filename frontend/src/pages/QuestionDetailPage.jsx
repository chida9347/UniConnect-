import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock3,
  MessageSquareText,
  Send,
  Trash2,
} from 'lucide-react';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import { FormField, Textarea } from '../components/FormControls';
import { ErrorState, LoadingState } from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { questionService } from '../services/questionService';
import { formatDateTime } from '../utils/format';
import { getErrorMessage } from '../utils/apiError';

export default function QuestionDetailPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [answerError, setAnswerError] = useState('');
  const [posting, setPosting] = useState(false);
  const [answerTarget, setAnswerTarget] = useState(null);
  const [deletingAnswer, setDeletingAnswer] = useState(false);
  const [questionConfirm, setQuestionConfirm] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setQuestion(await questionService.get(id));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load this question.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleAnswer = async (event) => {
    event.preventDefault();
    if (answerText.trim().length < 2) {
      setAnswerError('Write at least a short answer');
      return;
    }
    setPosting(true);
    setAnswerError('');
    try {
      await questionService.answer(id, { content: answerText.trim() });
      setAnswerText('');
      setQuestion(await questionService.get(id));
      addToast('Answer posted');
    } catch (requestError) {
      setAnswerError(getErrorMessage(requestError, 'Could not post your answer.'));
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteAnswer = async () => {
    if (!answerTarget) return;
    setDeletingAnswer(true);
    try {
      await questionService.removeAnswer(answerTarget.id);
      setAnswerTarget(null);
      setQuestion(await questionService.get(id));
      addToast('Answer deleted');
    } catch (requestError) {
      addToast(getErrorMessage(requestError, 'Could not delete the answer.'), 'error');
    } finally {
      setDeletingAnswer(false);
    }
  };

  const handleDeleteQuestion = async () => {
    setDeletingQuestion(true);
    try {
      if (isAdmin && question.author.id !== user.id) await questionService.adminRemove(question.id);
      else await questionService.remove(question.id);
      addToast('Question deleted');
      navigate('/questions', { replace: true });
    } catch (requestError) {
      addToast(getErrorMessage(requestError, 'Could not delete the question.'), 'error');
      setDeletingQuestion(false);
    }
  };

  if (loading) return <LoadingState message="Loading question…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!question) return null;

  const isOwner = question.author.id === user?.id;

  return (
    <div className="detail-page">
      <Link to="/questions" className="back-link"><ArrowLeft size={16} /> Back to questions</Link>

      <article className="detail-card question-detail-card">
        <div className="detail-author">
          <Avatar name={question.author.fullName} />
          <div>
            <div className="detail-author-name">
              <strong>{question.author.fullName}</strong>
              {question.author.role === 'ADMIN' && <Badge variant="warning">Admin</Badge>}
            </div>
            <span>{question.author.universityId} · {question.author.department}</span>
          </div>
          <div className="detail-date">
            <Clock3 size={14} />
            {formatDateTime(question.createdAt)}
          </div>
        </div>

        <div className="detail-body">
          <div className="question-detail-labels">
            <Badge variant={question.answerCount ? 'success' : 'neutral'}>
              {question.answerCount} {question.answerCount === 1 ? 'answer' : 'answers'}
            </Badge>
          </div>
          <h1>{question.title}</h1>
          <p className="detail-content">{question.content}</p>
        </div>

        {(isOwner || isAdmin) && (
          <div className="detail-footer">
            <span className="detail-updated">Asked {formatDateTime(question.createdAt)}</span>
            <Button variant="danger-ghost" size="sm" onClick={() => setQuestionConfirm(true)}>
              <Trash2 size={15} /> Delete question
            </Button>
          </div>
        )}
      </article>

      <section className="answers-section">
        <div className="section-card-header">
          <div>
            <h2>{question.answerCount} {question.answerCount === 1 ? 'answer' : 'answers'}</h2>
            <p>Helpful responses from the student community.</p>
          </div>
        </div>

        {question.answers?.length ? (
          <div className="answer-list">
            {question.answers.map((answer) => {
              const canDelete = answer.author.id === user.id || isAdmin;
              return (
                <article className="answer-card" key={answer.id}>
                  <div className="answer-author">
                    <Avatar name={answer.author.fullName} size="sm" />
                    <div>
                      <div className="detail-author-name">
                        <strong>{answer.author.fullName}</strong>
                        {answer.author.role === 'ADMIN' && <Badge variant="warning">Admin</Badge>}
                      </div>
                      <span>{answer.author.department} · {formatDateTime(answer.createdAt)}</span>
                    </div>
                    {canDelete && (
                      <button
                        type="button"
                        className="icon-button danger"
                        onClick={() => setAnswerTarget(answer)}
                        aria-label="Delete this answer"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <p>{answer.content}</p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="inline-empty">
            <p>No answers yet. If you know something useful, be the first to respond.</p>
          </div>
        )}

        <form className="answer-form" onSubmit={handleAnswer}>
          <h3>Your answer</h3>
          <p>Keep it constructive, specific and respectful.</p>
          <FormField label="" htmlFor="answer-content" error={answerError}>
            <Textarea
              id="answer-content"
              rows={5}
              placeholder="Write a helpful answer…"
              value={answerText}
              maxLength={5000}
              onChange={(event) => {
                setAnswerText(event.target.value);
                setAnswerError('');
              }}
            />
          </FormField>
          <div className="answer-form-footer">
            <span>{answerText.length}/5,000</span>
            <Button type="submit" loading={posting}>
              <Send size={16} /> Post answer
            </Button>
          </div>
        </form>
      </section>

      <ConfirmDialog
        open={Boolean(answerTarget)}
        onClose={() => setAnswerTarget(null)}
        onConfirm={handleDeleteAnswer}
        loading={deletingAnswer}
        title="Delete this answer?"
        description="Your answer will be permanently removed from the discussion."
      />

      <ConfirmDialog
        open={questionConfirm}
        onClose={() => setQuestionConfirm(false)}
        onConfirm={handleDeleteQuestion}
        loading={deletingQuestion}
        title="Delete this question?"
        description="The question and every answer below it will be permanently deleted."
      />
    </div>
  );
}
