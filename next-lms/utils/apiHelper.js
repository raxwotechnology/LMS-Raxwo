/**
 * Client-side API helper for authenticated requests.
 * In Next.js, cookies are sent automatically with same-origin requests,
 * so we don't need to manually attach Authorization headers.
 */

/**
 * Make an authenticated fetch request.
 * Handles 401 responses by redirecting to login.
 */
export async function authenticatedFetch(url, options = {}) {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Don't set Content-Type for FormData (let browser set multipart boundary)
  if (options.body instanceof FormData) {
    delete defaultOptions.headers['Content-Type'];
  }

  const response = await fetch(url, { ...defaultOptions, ...options, headers: { ...defaultOptions.headers, ...options.headers } });

  if (response.status === 401) {
    // Clear any local user data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      window.location.href = '/admin/login';
    }
    throw new Error('Unauthorized');
  }

  return response;
}

/**
 * Get auth headers (for backward compatibility).
 * In the Next.js app, cookies are sent automatically.
 */
export function getAuthHeaders() {
  return {};
}

/**
 * Check if user is authenticated by looking at localStorage user data.
 * The actual token is in an HTTP-only cookie (not accessible via JS).
 */
export function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  const user = localStorage.getItem('user');
  return !!user;
}
