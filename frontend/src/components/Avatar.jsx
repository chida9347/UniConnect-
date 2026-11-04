import { getInitials } from '../utils/format';

export default function Avatar({ name, size = 'md', className = '' }) {
  return (
    <span
      className={`avatar avatar-${size} ${className}`.trim()}
      title={name}
      aria-label={name}
    >
      {getInitials(name)}
    </span>
  );
}
