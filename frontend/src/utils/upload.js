import {
  MAX_POST_IMAGE_SIZE,
  MAX_POST_IMAGES,
  POST_IMAGE_EXTENSIONS,
} from './constants';

export function validatePostImages(files, existingCount = 0) {
  if (!files || files.length === 0) return '';
  if (existingCount + files.length > MAX_POST_IMAGES) {
    return `You can attach up to ${MAX_POST_IMAGES} images per post.`;
  }
  for (const file of files) {
    if (file.size > MAX_POST_IMAGE_SIZE) {
      return `“${file.name}” is larger than 5 MB.`;
    }
    const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
    if (!POST_IMAGE_EXTENSIONS.includes(extension)) {
      return 'Only PNG, JPG, GIF and WebP images are supported.';
    }
  }
  return '';
}
