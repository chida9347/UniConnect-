import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { FormField, Input, Select, Textarea } from '../components/FormControls';
import { ErrorState, LoadingState } from '../components/Loading';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { opportunityService } from '../services/opportunityService';
import { CATEGORY_LABELS, OPPORTUNITY_CATEGORIES } from '../utils/constants';
import { daysUntil, formatDate, todayInputValue } from '../utils/format';
import { getErrorMessage, getFieldErrors } from '../utils/apiError';

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'INTERNSHIP',
  organization: '',
  applicationUrl: '',
  deadline: '',
};

function deadlineMeta(deadline) {
  const days = daysUntil(deadline);
  if (days === null) return { label: 'No deadline', tone: 'neutral', closed: false };
  if (days < 0) return { label: `Closed ${formatDate(deadline)}`, tone: 'danger', closed: true };
  if (days === 0) return { label: 'Closes today', tone: 'danger', closed: false };
  if (days === 1) return { label: 'Closes tomorrow', tone: 'warning', closed: false };
  if (days <= 7) return { label: `Closes in ${days} days`, tone: 'warning', closed: false };
  return { label: `Closes ${formatDate(deadline)}`, tone: 'neutral', closed: false };
}

export default function OpportunitiesPage() {
  const { isAdmin } = useAuth();
  const { addToast } = useToast();
  const [opportunities, setOpportunities] = useState([]);
  const [meta, setMeta] = useState({ totalElements: 0, totalPages: 0, page: 0 });
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput);
  const [category, setCategory] = useState('');
  const [upcomingOnly, setUpcomingOnly] = useState(true);
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

  useEffect(() => {
    setPage(0);
  }, [search, category, upcomingOnly]);

  useEffect(() => {
    let active = true;
    async function loadOpportunities() {
      setLoading(true);
      setError('');
      try {
        const result = await opportunityService.list({
          search,
          category,
          upcomingOnly,
          page,
          size: 12,
        });
        if (!active) return;
        setOpportunities(result.content);
        setMeta({
          totalElements: result.totalElements,
          totalPages: result.totalPages,
          page: result.page,
        });
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError, 'Unable to load opportunities.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadOpportunities();
    return () => {
      active = false;
    };
  }, [search, category, upcomingOnly, page, refreshKey]);

  const hasFilters = Boolean(search || category || !upcomingOnly);

  const clearFilters = () => {
    setSearchInput('');
    setCategory('');
    setUpcomingOnly(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setForm({
      title: record.title,
      description: record.description,
      category: record.category,
      organization: record.organization,
      applicationUrl: record.applicationUrl,
      deadline: record.deadline || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const next = {};
    if (form.title.trim().length < 3) next.title = 'Title must be at least 3 characters';
    if (form.title.trim().length > 200) next.title = 'Title cannot exceed 200 characters';
    if (form.description.trim().length < 10) next.description = 'Add at least 10 characters of description';
    if (!form.category) next.category = 'Select a category';
    if (!form.organization.trim()) next.organization = 'Organization is required';
    if (!form.applicationUrl.trim()) next.applicationUrl = 'Application URL is required';
    else if (!/^https?:\/\/.+/i.test(form.applicationUrl.trim())) {
      next.applicationUrl = 'Application URL must start with http:// or https://';
    }
    if (!form.deadline) next.deadline = 'Deadline is required';
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        organization: form.organization.trim(),
        applicationUrl: form.applicationUrl.trim(),
      };
      if (editing) {
        await opportunityService.update(editing.id, payload);
        addToast('Opportunity updated');
      } else {
        await opportunityService.create(payload);
        addToast('Opportunity published');
      }
      setModalOpen(false);
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setFormErrors(getFieldErrors(requestError));
      addToast(getErrorMessage(requestError, 'Could not save the opportunity.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await opportunityService.remove(deleteTarget.id);
      addToast('Opportunity deleted');
      setDeleteTarget(null);
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      addToast(getErrorMessage(requestError, 'Could not delete the opportunity.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Beyond the classroom"
        title="Opportunities"
        description="Internships, hackathons, workshops, competitions and university events, all in one place."
        actions={
          isAdmin ? (
            <Button onClick={openCreate}>
              <Plus size={17} /> Add opportunity
            </Button>
          ) : null
        }
      />

      <div className="toolbar">
        <div className="search-input">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search opportunities, organizations or keywords…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Search opportunities"
          />
        </div>
        <Select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Filter by category"
          className="toolbar-select"
        >
          <option value="">All categories</option>
          {OPPORTUNITY_CATEGORIES.map((item) => (
            <option value={item.value} key={item.value}>{item.label}</option>
          ))}
        </Select>
        <label className="filter-toggle">
          <input
            type="checkbox"
            checked={upcomingOnly}
            onChange={(event) => setUpcomingOnly(event.target.checked)}
          />
          <span>Upcoming only</span>
        </label>
      </div>

      {loading ? (
        <LoadingState message="Loading opportunities…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setRefreshKey((key) => key + 1)} />
      ) : opportunities.length === 0 ? (
        <EmptyState
          icon={BriefcaseBusiness}
          title={hasFilters ? 'No opportunities match this filter' : 'No opportunities published yet'}
          description={
            hasFilters
              ? 'Try a different keyword, category or include opportunities whose deadline has passed.'
              : isAdmin
                ? 'Publish internships, events and competitions for students using the Add opportunity button.'
                : 'Official opportunities will appear here once they are published by an administrator.'
          }
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>
            ) : isAdmin ? (
              <Button onClick={openCreate}><Plus size={16} /> Add opportunity</Button>
            ) : null
          }
        />
      ) : (
        <>
          <p className="results-summary">
            {meta.totalElements} {meta.totalElements === 1 ? 'opportunity' : 'opportunities'}
            {upcomingOnly ? ' with open deadlines' : ''}
          </p>
          <div className="opportunity-grid">
            {opportunities.map((opportunity) => {
              const deadline = deadlineMeta(opportunity.deadline);
              return (
                <article className={`opportunity-card ${deadline.closed ? 'opportunity-closed' : ''}`} key={opportunity.id}>
                  <div className="opportunity-card-top">
                    <Badge variant="primary">{CATEGORY_LABELS[opportunity.category] || opportunity.category}</Badge>
                    {isAdmin && (
                      <div className="card-actions">
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => openEdit(opportunity)}
                          aria-label={`Edit ${opportunity.title}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-button danger"
                          onClick={() => setDeleteTarget(opportunity)}
                          aria-label={`Delete ${opportunity.title}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="opportunity-card-body">
                    <h2>{opportunity.title}</h2>
                    <p className="opportunity-org">
                      <Building2 size={14} aria-hidden="true" />
                      {opportunity.organization}
                    </p>
                    <p>{opportunity.description}</p>
                  </div>

                  <div className="opportunity-meta">
                    <span className={`deadline-chip deadline-${deadline.tone}`}>
                      <Clock3 size={14} aria-hidden="true" />
                      {deadline.label}
                    </span>
                    <span className="opportunity-posted">
                      <CalendarDays size={14} aria-hidden="true" />
                      Added {formatDate(opportunity.createdAt)}
                    </span>
                  </div>

                  <div className="opportunity-card-footer">
                    <span className="opportunity-poster">
                      Posted by {opportunity.postedBy?.fullName || 'Administrator'}
                    </span>
                    <a
                      href={opportunity.applicationUrl}
                      className="btn btn-secondary btn-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View opportunity <ArrowUpRight size={15} />
                    </a>
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
        title={editing ? 'Edit opportunity' : 'Add opportunity'}
        description="Publish verified opportunities with a working application link and clear deadline."
        size="lg"
      >
        <form onSubmit={handleSave} className="stack-form" noValidate>
          <FormField label="Title" htmlFor="opportunity-title" error={formErrors.title} required>
            <Input
              id="opportunity-title"
              placeholder="e.g. Summer Research Internship 2027"
              value={form.title}
              maxLength={200}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              autoFocus
            />
          </FormField>

          <div className="form-row">
            <FormField label="Category" htmlFor="opportunity-category" error={formErrors.category} required>
              <Select
                id="opportunity-category"
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              >
                {OPPORTUNITY_CATEGORIES.map((item) => (
                  <option value={item.value} key={item.value}>{item.label}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Organization" htmlFor="opportunity-organization" error={formErrors.organization} required>
              <Input
                id="opportunity-organization"
                placeholder="e.g. University placement cell"
                value={form.organization}
                maxLength={150}
                onChange={(event) => setForm((current) => ({ ...current, organization: event.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="Description" htmlFor="opportunity-description" error={formErrors.description} required>
            <Textarea
              id="opportunity-description"
              rows={5}
              placeholder="Describe the opportunity, eligibility and what students need to know…"
              value={form.description}
              maxLength={10000}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </FormField>

          <div className="form-row">
            <FormField
              label="Application URL"
              htmlFor="opportunity-url"
              error={formErrors.applicationUrl}
              hint="Must begin with https:// or http://"
              required
            >
              <Input
                id="opportunity-url"
                type="url"
                placeholder="https://example.com/apply"
                value={form.applicationUrl}
                maxLength={500}
                onChange={(event) => setForm((current) => ({ ...current, applicationUrl: event.target.value }))}
              />
            </FormField>
            <FormField
              label="Deadline"
              htmlFor="opportunity-deadline"
              error={formErrors.deadline}
              hint={
                editing && daysUntil(editing.deadline) < 0
                  ? 'This deadline has already passed. Choose a new date to keep the listing open.'
                  : 'The last date to apply.'
              }
              required
            >
              <Input
                id="opportunity-deadline"
                type="date"
                min={todayInputValue()}
                value={form.deadline}
                onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
              />
            </FormField>
          </div>

          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Save changes' : 'Publish opportunity'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this opportunity?"
        description="Students will no longer be able to see this listing. This cannot be undone."
      />
    </div>
  );
}
