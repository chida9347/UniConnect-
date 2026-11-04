import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Building2,
  Eye,
  EyeOff,
  GraduationCap,
  Hash,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react';
import AuthShell from '../components/AuthShell';
import Button from '../components/Button';
import { FormField, Input, Select } from '../components/FormControls';
import { useAuth } from '../context/AuthContext';
import { ACADEMIC_YEARS, DEPARTMENTS } from '../utils/constants';
import { getErrorMessage, getFieldErrors } from '../utils/apiError';

const INITIAL = {
  fullName: '',
  universityId: '',
  email: '',
  password: '',
  confirmPassword: '',
  department: '',
  academicYear: '',
};

export default function RegisterPage() {
  const { register, user, initializing } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordScore = useMemo(() => {
    const password = form.password;
    return [
      password.length >= 8,
      /[a-z]/.test(password) && /[A-Z]/.test(password),
      /\d/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;
  }, [form.password]);

  if (!initializing && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError('');
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required';
    else if (form.fullName.trim().length < 2) next.fullName = 'Enter your full name';

    if (!form.universityId.trim()) next.universityId = 'University ID is required';
    else if (!/^[A-Za-z0-9/-]+$/.test(form.universityId.trim())) {
      next.universityId = 'Use letters, numbers, hyphens or slashes only';
    }

    if (!form.email.trim()) next.email = 'University email is required';
    else if (!/^[A-Z0-9._%+-]+@klu\.ac\.in$/i.test(form.email.trim())) {
      next.email = 'Use your @klu.ac.in university email';
    }

    if (!form.department) next.department = 'Select your department';
    if (!form.academicYear) next.academicYear = 'Select your academic year';

    if (!form.password) next.password = 'Password is required';
    else if (
      form.password.length < 8 ||
      !/[a-z]/.test(form.password) ||
      !/[A-Z]/.test(form.password) ||
      !/\d/.test(form.password) ||
      !/[^A-Za-z0-9]/.test(form.password)
    ) {
      next.password = 'Use 8+ characters with uppercase, lowercase, number and special character';
    }

    if (form.password !== form.confirmPassword) {
      next.confirmPassword = 'Passwords do not match';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError('');
    try {
      await register({
        ...form,
        fullName: form.fullName.trim(),
        universityId: form.universityId.trim(),
        email: form.email.trim().toLowerCase(),
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      setErrors(fieldErrors);
      setServerError(getErrorMessage(error, 'Unable to create your account.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join the verified student community at Kalasalingam University."
      footer={
        <p>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {serverError && (
          <div className="alert alert-error" role="alert">
            {serverError}
          </div>
        )}

        <FormField label="Full name" htmlFor="fullName" error={errors.fullName} required>
          <div className="input-with-icon">
            <UserRound size={17} aria-hidden="true" />
            <Input
              id="fullName"
              autoComplete="name"
              placeholder="Your full name"
              value={form.fullName}
              onChange={update('fullName')}
              aria-invalid={Boolean(errors.fullName)}
            />
          </div>
        </FormField>

        <div className="form-row">
          <FormField label="University ID" htmlFor="universityId" error={errors.universityId} required>
            <div className="input-with-icon">
              <Hash size={17} aria-hidden="true" />
              <Input
                id="universityId"
                placeholder="e.g. 9921004123"
                value={form.universityId}
                onChange={update('universityId')}
                aria-invalid={Boolean(errors.universityId)}
              />
            </div>
          </FormField>

          <FormField label="Academic year" htmlFor="academicYear" error={errors.academicYear} required>
            <div className="input-with-icon">
              <GraduationCap size={17} aria-hidden="true" />
              <Select
                id="academicYear"
                value={form.academicYear}
                onChange={update('academicYear')}
                aria-invalid={Boolean(errors.academicYear)}
              >
                <option value="">Select year</option>
                {ACADEMIC_YEARS.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </Select>
            </div>
          </FormField>
        </div>

        <FormField label="University email" htmlFor="email" error={errors.email} required>
          <div className="input-with-icon">
            <Mail size={17} aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@klu.ac.in"
              value={form.email}
              onChange={update('email')}
              aria-invalid={Boolean(errors.email)}
            />
          </div>
        </FormField>

        <FormField label="Department" htmlFor="department" error={errors.department} required>
          <div className="input-with-icon">
            <Building2 size={17} aria-hidden="true" />
            <Select
              id="department"
              value={form.department}
              onChange={update('department')}
              aria-invalid={Boolean(errors.department)}
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </Select>
          </div>
        </FormField>

        <div className="form-row">
          <FormField label="Password" htmlFor="password" error={errors.password} required>
            <div className="input-with-icon input-with-action">
              <LockKeyhole size={17} aria-hidden="true" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a password"
                value={form.password}
                onChange={update('password')}
                aria-invalid={Boolean(errors.password)}
              />
              <button
                type="button"
                className="input-action"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </FormField>

          <FormField
            label="Confirm password"
            htmlFor="confirmPassword"
            error={errors.confirmPassword}
            required
          >
            <div className="input-with-icon">
              <LockKeyhole size={17} aria-hidden="true" />
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                aria-invalid={Boolean(errors.confirmPassword)}
              />
            </div>
          </FormField>
        </div>

        {form.password && (
          <div className="password-strength" aria-live="polite">
            <div className="password-strength-bars">
              {[1, 2, 3, 4].map((step) => (
                <span
                  key={step}
                  className={passwordScore >= step ? `filled strength-${passwordScore}` : ''}
                />
              ))}
            </div>
            <p>
              {passwordScore <= 1 && 'Weak password'}
              {passwordScore === 2 && 'Fair password'}
              {passwordScore === 3 && 'Good password'}
              {passwordScore === 4 && 'Strong password'}
            </p>
          </div>
        )}

        <Button type="submit" loading={loading} className="btn-block" size="lg">
          Create account
        </Button>
        <p className="auth-legal">
          By creating an account, you agree to use UniConnect respectfully and only upload
          academic material you have permission to share.
        </p>
      </form>
    </AuthShell>
  );
}
