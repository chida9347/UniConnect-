import { GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Logo({ light = false, to = '/', compact = false }) {
  const content = (
    <>
      <span className={`logo-mark ${light ? 'logo-mark-light' : ''}`} aria-hidden="true">
        <GraduationCap size={20} strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className={`logo-word ${light ? 'logo-word-light' : ''}`}>
          Uni<span>Connect</span>
        </span>
      )}
    </>
  );

  if (!to) return <span className="logo">{content}</span>;
  return (
    <Link to={to} className="logo" aria-label="UniConnect home">
      {content}
    </Link>
  );
}
