import { Loader2, RefreshCw } from 'lucide-react';
import Button from './Button';

export function LoadingState({ message = 'Loading…', compact = false }) {
  return (
    <div className={`loading-state ${compact ? 'loading-state-compact' : ''}`} role="status">
      <Loader2 size={compact ? 18 : 24} className="spin" />
      <span>{message}</span>
    </div>
  );
}

export function FullPageLoader({ message = 'Preparing your workspace…' }) {
  return (
    <div className="full-page-loader">
      <div className="full-page-loader-mark">UC</div>
      <LoadingState message={message} />
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <div>
        <strong>Unable to load this content</strong>
        <p>{message || 'Please try again.'}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw size={15} /> Retry
        </Button>
      )}
    </div>
  );
}
