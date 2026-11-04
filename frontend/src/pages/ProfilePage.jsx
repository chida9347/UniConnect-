import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  GraduationCap,
  Hash,
  LockKeyhole,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { FormField, Input, Select } from '../components/FormControls';
import { ErrorState, LoadingState } from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { profileService } from '../services/profileService';
import { ACADEMIC_YEARS, DEPARTMENTS } from '../utils/constants';
import { formatDate } from '../utils/format';
import { getErrorMessage, getFieldErrors } from '../utils/apiError';

const EMPTY_FORM = { fullName: '', department: '', academicYear: '' };

export default function ProfilePage() {
  const { updateUser } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await profileService.get();
      setProfile(result);
      setForm({
        fullName: result.fullName || '',
        department: result.department || '',
        academicYear: result.academicYear || '',
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load your profile.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const departmentOptions = useMemo(() => {
    const values = [...DEPARTMENTS];
    if (profile?.department && !values.includes(profile.department)) values.push(profile.department);
    return values;
  }, [profile?.department]);

  const yearOptions = useMemo(() => {
    const values = [...ACADEMIC_YEARS];
    if (profile?.academicYear && !values.includes(profile.academicYear)) values.push(profile.academicYear);
    return values;
  }, [profile?.academicYear]);

  const isDirty = Boolean(
    profile &&
      (form.fullName.trim() !== (profile.fullName || '') ||
        form.department !== (profile.department || '') ||
        form.academicYear !== (profile.academicYear || ''))
  );

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (form.fullName.trim().length < 2) next.fullName = 'Full name must be at least 2 characters';
    if (form.fullName.trim().length > 120) next.fullName = 'Full name cannot exceed 120 characters';
    if (!form.department.trim()) next.department = 'Department is required';
    if (!form.academicYear.trim()) next.academicYear = 'Academic year is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const updated = await profileService.update({
        fullName: form.fullName.trim(),
        department: form.department.trim(),
        academicYear: form.academicYear.trim(),
      });
      setProfile(updated);
      setForm({
        fullName: updated.fullName || '',
        department: updated.department || '',
        academicYear: updated.academicYear || '',
      });
      updateUser(updated);
      addToast('Profile updated');
    } catch (requestError) {
      setErrors(getFieldErrors(requestError));
      addToast(getErrorMessage(requestError, 'Could not update your profile.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading your profile…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!profile) return null;

  return (
    <div className="profile-page">
      <PageHeader
        eyebrow="Account settings"
        title="My Profile"
        description="Keep your academic details up to date so your contributions are easy to understand."
      />

      <div className="profile-grid">
        <section className="dashboard-card profile-identity-card">
          <div className="profile-identity-top">
            <Avatar name={profile.fullName} size="xl" />
            <div>
              <h2>{profile.fullName}</h2>
              <p>{profile.email}</p>
              <div className="profile-summary-badges">
                <Badge variant={profile.role === 'ADMIN' ? 'warning' : 'primary'}>{profile.role}</Badge>
                <Badge>{profile.academicYear}</Badge>
              </div>
            </div>
          </div>

          <dl className="profile-details">
            <div>
              <dt><Hash size={14} /> University ID</dt>
              <dd>{profile.universityId}</dd>
            </div>
            <div>
              <dt><Building2 size={14} /> Department</dt>
              <dd>{profile.department}</dd>
            </div>
            <div>
              <dt><GraduationCap size={14} /> Academic year</dt>
              <dd>{profile.academicYear}</dd>
            </div>
            <div>
              <dt><CalendarDays size={14} /> Member since</dt>
              <dd>{formatDate(profile.createdAt)}</dd>
            </div>
          </dl>

          <div className="profile-verification">
            <span><ShieldCheck size={18} /></span>
            <div>
              <strong>Verified university account</strong>
              <p>This profile is linked to a verified @klu.ac.in email address.</p>
            </div>
          </div>
        </section>

        <section className="dashboard-card profile-form-card">
          <div className="section-card-header">
            <div>
              <h2>Edit your details</h2>
              <p>Changes are visible across your posts, questions and notes.</p>
            </div>
            <span className="section-icon"><UserRound size={18} /></span>
          </div>

          <form className="stack-form" onSubmit={handleSubmit} noValidate>
            <FormField label="Full name" htmlFor="profile-fullName" error={errors.fullName} required>
              <Input
                id="profile-fullName"
                autoComplete="name"
                value={form.fullName}
                maxLength={120}
                onChange={update('fullName')}
              />
            </FormField>

            <div className="form-row">
              <FormField label="Department" htmlFor="profile-department" error={errors.department} required>
                <Select
                  id="profile-department"
                  value={form.department}
                  onChange={update('department')}
                >
                  <option value="">Select department</option>
                  {departmentOptions.map((department) => (
                    <option key={department} value={department}>{department}</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Academic year" htmlFor="profile-academicYear" error={errors.academicYear} required>
                <Select
                  id="profile-academicYear"
                  value={form.academicYear}
                  onChange={update('academicYear')}
                >
                  <option value="">Select year</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Select>
              </FormField>
            </div>

            <div className="protected-fields">
              <div className="protected-fields-heading">
                <LockKeyhole size={15} />
                <span>Managed by the university</span>
              </div>
              <div className="protected-grid">
                <div>
                  <span>University email</span>
                  <strong>{profile.email}</strong>
                </div>
                <div>
                  <span>University ID</span>
                  <strong>{profile.universityId}</strong>
                </div>
                <div>
                  <span>Account role</span>
                  <strong>{profile.role}</strong>
                </div>
              </div>
              <p>Email, university ID and role cannot be changed from this page.</p>
            </div>

            <div className="profile-form-actions">
              <Button
                variant="secondary"
                onClick={() => {
                  setForm({
                    fullName: profile.fullName || '',
                    department: profile.department || '',
                    academicYear: profile.academicYear || '',
                  });
                  setErrors({});
                }}
                disabled={!isDirty || saving}
              >
                Reset
              </Button>
              <Button type="submit" loading={saving} disabled={!isDirty}>
                <Save size={16} /> Save changes
              </Button>
            </div>
          </form>

          <div className="profile-note">
            <BadgeCheck size={17} />
            <span>
              Your name, department and academic year appear alongside every contribution you make.
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
