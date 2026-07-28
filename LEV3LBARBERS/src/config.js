export const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * Resolve a stored image path/URL to a full URL.
 * Uploads are served either from local disk (a relative path like
 * "/uploads/gallery/x.jpg", needs BACKEND prefixed) or from R2/cloud storage
 * (already a full "https://..." URL, must be used as-is — prefixing BACKEND
 * onto an already-absolute URL produces a malformed, unloadable src).
 */
export const resolveImageUrl = (url) => {
  if (!url) return url;
  return /^https?:\/\//i.test(url) ? url : `${BACKEND}${url}`;
};
