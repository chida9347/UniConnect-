import { useEffect, useState } from 'react';
import {
  Building2,
  ContactRound,
  Mail,
  Pencil,
  Phone,
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
import { FormField, Input } from '../components/FormControls';
import { ErrorState, LoadingState } from '../components/Loading';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { facultyService } from '../services/facultyService';
import { getErrorMessage, getFieldErrors } from '../utils/apiError';

const EMPTY_FORM = {
  name: '',
  department: '',
  designation: '',
  email: '',
  specialization: '',
  contactInfo: '',
};

export default function FacultyPage() {
  const { isAdmin } = useAuth();
  const { addToast } = useToast();
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [meta, setMeta] = useState({ totalElements: 0 });
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput);
  const [department, setDepartment] = useState('');
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
    let active = true;
    async function loadFaculty() {
      setLoading(true);
      setError('');
      try {
        const result = await facultyService.list({ search, department, size: 100 });
        if (!active) return;
        setFaculty(result.content);
        setMeta({ totalElements: result.totalElements });
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError, 'Unable to load the faculty directory.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadFaculty();
    return () => { active = false; };
  }, [search, department, refreshKey]);

  useEffect(() => {
    facultyService.departments().then(setDepartments).catch(() => {});
  }, [refreshKey]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setForm({
      name: record.name,
      department: record.department,
      designation: record.designation,
      email: record.email,
      specialization: record.specialization,
      contactInfo: record.contactInfo || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Faculty name is required';
    if (!form.department.trim()) next.department = 'Department is required';
    if (!form.designation.trim()) next.designation = 'Designation is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (!form.specialization.trim()) next.specialization = 'Specialization is required';
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await facultyService.update(editing.id, form);
        addToast('Faculty record updated');
      } else {
        await facultyService.create(form);
        addToast('Faculty record added');
      }
      setModalOpen(false);
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setFormErrors(getFieldErrors(requestError));
      addToast(getErrorMessage(requestError, 'Could not save the faculty record.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await facultyService.remove(deleteTarget.id);
      addToast('Faculty record deleted');
      setDeleteTarget(null);
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      addToast(getErrorMessage(requestError, 'Could not delete the faculty record.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Campus directory"
        title="Faculty Information"
        description="Find faculty members by name, department, designation or area of specialization."
        actions={
          isAdmin ? (
            <Button onClick={openCreate}><Plus size={17} /> Add faculty</Button>
          ) : null
        }
      />

      <div className="toolbar">
        <div className="search-input">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search faculty, designation or specialization…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Search faculty"
          />
        </div>
        <select
          className="input toolbar-select"
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          aria-label="Filter by department"
        >
          <option value="">All departments</option>
          {departments.map((item) => (
            <option value={item} key={item}>{item}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState message="Loading faculty directory…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setRefreshKey((key) => key + 1)} />
      ) : faculty.length === 0 ? (
        <EmptyState
          icon={ContactRound}
          title={search || department ? 'No faculty match this filter' : 'The faculty directory is empty'}
          description={
            search || department
              ? 'Try a different search or department.'
              : isAdmin
                ? 'Add verified faculty information using the Add faculty button.'
                : 'Faculty information will appear here once it is published by an administrator.'
          }
          action={
            search || department ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchInput('');
                  setDepartment('');
                }}
              >
                Clear filters
              </Button>
            ) : isAdmin ? (
              <Button onClick={openCreate}><Plus size={16} /> Add faculty</Button>
            ) : null
          }
        />
      ) : (
        <>
          <p className="results-summary">
            {meta.totalElements} {meta.totalElements === 1 ? 'faculty member' : 'faculty members'}
          </p>
          <div className="faculty-grid">
            {faculty.map((record) => (
              <article className="faculty-card" key={record.id}>
                <div className="faculty-card-header">
                  <Avatar name={record.name} size="lg" />
                  <div>
                    <h2>{record.name}</h2>
                    <p>{record.designation}</p>
                  </div>
                  {isAdmin && (
                    <div className="card-actions">
                      <button type="button" className="icon-button" onClick={() => openEdit(record)} aria-label="Edit faculty">
                        <Pencil size={15} />
                      </button>
                      <button type="button" className="icon-button danger" onClick={() => setDeleteTarget(record)} aria-label="Delete faculty">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
                <Badge variant="primary">{record.department}</Badge>
                <dl className="faculty-details">
                  <div>
                    <dt><Building2 size={14} /> Specialization</dt>
                    <dd>{record.specialization}</dd>
                  </div>
                  <div>
                    <dt><Mail size={14} /> Email</dt>
                    <dd><a href={`mailto:${record.email}`}>{record.email}</a></dd>
                  </div>
                  {record.contactInfo && (
                    <div>
                      <dt><Phone size={14} /> Contact</dt>
                      <dd>{record.contactInfo}</dd>
                    </div>
                  )}
                </dl>
              </article>
            ))}
          </div>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit faculty record' : 'Add faculty record'}
        description="Use verified, official information only."
        size="lg"
      >
        <form onSubmit={handleSave} className="stack-form" noValidate>
          <div className="form-row">
            <FormField label="Faculty name" htmlFor="faculty-name" error={formErrors.name} required>
              <Input
                id="faculty-name"
                value={form.name}
                maxLength={120}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                autoFocus
              />
            </FormField>
            <FormField label="Designation" htmlFor="faculty-designation" error={formErrors.designation} required>
              <Input
                id="faculty-designation"
                value={form.designation}
                maxLength={100}
                placeholder="e.g. Professor"
                onChange={(event) => setForm((current) => ({ ...current, designation: event.target.value }))}
              />
            </FormField>
          </div>
          <div className="form-row">
            <FormField label="Department" htmlFor="faculty-department" error={formErrors.department} required>
              <Input
                id="faculty-department"
                value={form.department}
                maxLength={100}
                onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
              />
            </FormField>
            <FormField label="Email" htmlFor="faculty-email" error={formErrors.email} required>
              <Input
                id="faculty-email"
                type="email"
                value={form.email}
                maxLength={160}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
            </FormField>
          </div>
          <FormField label="Specialization / subjects" htmlFor="faculty-specialization" error={formErrors.specialization} required>
            <Input
              id="faculty-specialization"
              value={form.specialization}
              maxLength={180}
              onChange={(event) => setForm((current) => ({ ...current, specialization: event.target.value }))}
            />
          </FormField>
          <FormField label="Contact information" htmlFor="faculty-contact" error={formErrors.contactInfo} hint="Optional phone number, office location or consultation details.">
            <Input
              id="faculty-contact"
              value={form.contactInfo}
              maxLength={200}
              onChange={(event) => setForm((current) => ({ ...current, contactInfo: event.target.value }))}
            />
          </FormField>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Add faculty'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this faculty record?"
        description="This directory entry will be permanently removed."
      />
    </div>
  );
}
