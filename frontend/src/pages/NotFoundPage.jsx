import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import Logo from '../components/Logo';

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <Logo />
      <div className="not-found-card">
        <div className="empty-state-icon"><Compass size={28} /></div>
        <p className="eyebrow">404 error</p>
        <h1>This page isn’t on the map.</h1>
        <p>The link may be broken, or the page may have been moved.</p>
        <Link to="/" className="btn btn-primary btn-md">
          <ArrowLeft size={16} /> Back to UniConnect
        </Link>
      </div>
    </div>
  );
}
