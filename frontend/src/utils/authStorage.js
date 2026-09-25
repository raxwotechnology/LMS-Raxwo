// Safe authentication storage utilities
export const getStoredAdminUser = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw || raw === 'undefined' || raw === 'null') return {};
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object') ? parsed : {};
  } catch (e) {
    return {};
  }
};

export const getStoredAdminToken = () => {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token || token === 'undefined' || token === 'null') return null;
    return token.trim();
  } catch (e) {
    return null;
  }
};

export const clearAdminAuth = () => {
  try {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    localStorage.removeItem('admin');
  } catch (e) {
    // ignore
  }
};

export const isStoredAdminValid = () => {
  const token = getStoredAdminToken();
  const user = getStoredAdminUser();
  if (!token) return false;
  return Boolean(user && (user.id || user._id || user.role || user.type || user.email));
};
