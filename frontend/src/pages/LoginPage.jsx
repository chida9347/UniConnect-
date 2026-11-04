import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import Button from '../components/Button';
import { FormField, Input } from '../components/FormControls';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, getFieldErrors } from '../utils/apiError';

export default function LoginPage() {
  const { login, user, initializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    if (!form.email.trim()) next.email = 'University email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (!form.password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError('');
    try {
      await login({ email: form.email.trim(), password: form.password });
      const target = location.state?.from?.pathname || '/dashboard';
      navigate(target, { replace: true });
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      setErrors(fieldErrors);
      setServerError(getErrorMessage(error, 'Unable to sign in.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with your university account to continue."
      footer={
        <p>
          New to UniConnect? <Link to="/register">Create your account</Link>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {serverError && (
          <div className="alert alert-error" role="alert">
            {serverError}
          </div>
        )}

        <FormField label="University email" htmlFor="email" error={errors.email} required>
          <div className="input-with-icon">
            <Mail size={17} aria-hidden="true" />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@klu.ac.in"
              value={form.email}
              onChange={update('email')}
              aria-invalid={Boolean(errors.email)}
              autoFocus
            />
          </div>
        </FormField>

        <FormField label="Password" htmlFor="password" error={errors.password} required>
          <div className="input-with-icon input-with-action">
            <LockKeyhole size={17} aria-hidden="true" />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
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

        <Button type="submit" loading={loading} className="btn-block" size="lg">
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
