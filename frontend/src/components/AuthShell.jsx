import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, MessagesSquare, ShieldCheck } from 'lucide-react';
import Logo from './Logo';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <aside className="auth-brand-panel">
        <div className="auth-brand-top">
          <Logo light to="/" />
          <Link to="/" className="auth-back-link">
            <ArrowLeft size={15} /> Back to home
          </Link>
        </div>
        <div className="auth-brand-copy">
          <span className="landing-pill landing-pill-dark">
            <span className="status-dot" /> Built for Kalasalingam students
          </span>
          <h1>Your university, connected.</h1>
          <p>
            One focused place for academic resources, student discussions, faculty details,
            questions and opportunities.
          </p>
          <ul className="auth-feature-list">
            <li><BookOpen size={18} /> Share and discover study resources</li>
            <li><MessagesSquare size={18} /> Learn together through discussions</li>
            <li><ShieldCheck size={18} /> A verified university-only community</li>
          </ul>
        </div>
        <p className="auth-brand-footer">Kalasalingam Academy of Research and Education</p>
      </aside>

      <main className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-mobile-logo">
            <Logo />
          </div>
          <div className="auth-heading">
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          {children}
          {footer && <div className="auth-footer">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
