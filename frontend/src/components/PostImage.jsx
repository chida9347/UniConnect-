import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { postService } from '../services/postService';

/**
 * Images live behind JWT auth, so a plain <img src> cannot load them.
 * Fetch the bytes with the authenticated API client and use an object URL.
 */
export default function PostImage({ image, className = '', onClick, alt }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    setSrc('');
    postService.imageBlob(image.id)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (active) setSrc('');
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [image.id]);

  if (!src) {
    return (
      <span className={`post-image-placeholder ${className}`} aria-label="Loading image">
        <ImageOff size={18} />
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt || image.originalFilename || 'Post image'}
      className={className}
      loading="lazy"
      onClick={onClick}
      onKeyDown={onClick ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      } : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    />
  );
}
