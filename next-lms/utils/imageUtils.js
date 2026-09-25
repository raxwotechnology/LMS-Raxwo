/**
 * Get a proper image URL from an image path.
 * Handles local uploads, S3 URLs, and relative paths.
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return null;

  // Already a full URL (S3 or external)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Local upload path - ensure it starts with /
  if (imagePath.startsWith('/uploads/')) {
    return imagePath;
  }

  // Relative path without leading slash
  if (imagePath.startsWith('uploads/')) {
    return `/${imagePath}`;
  }

  // Fallback: prepend /uploads/
  return `/uploads/${imagePath}`;
}

/**
 * Get image URL with a fallback placeholder.
 */
export function getImageUrlWithFallback(imagePath, placeholder = '/assets/class.png') {
  const url = getImageUrl(imagePath);
  return url || placeholder;
}
