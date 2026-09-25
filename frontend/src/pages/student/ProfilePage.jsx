import React, { useState, useEffect, useRef } from 'react';
import { useStudent } from '../../context/StudentContext';
import API_CONFIG from '../../config/api';
import { getImageUrl } from '../../utils/imageUtils';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function ProfilePage() {
  const { studentUser, updateStudentUser, showToast } = useStudent();

  const [personalForm, setPersonalForm] = useState({ name: '', email: '', phone: '' });
  const [profileImage, setProfileImage] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const isFormSynced = useRef(false);

  useEffect(() => {
    if (studentUser && !isFormSynced.current) {
      setPersonalForm({
        name: studentUser.name || '',
        email: studentUser.email || '',
        phone: studentUser.phone || '',
      });
      const src = studentUser.profileImage || '';
      setProfileImage(src);
      setLogoPreview(src ? getImageUrl(src) : null);
      isFormSynced.current = true;
    }
  }, [studentUser]);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (!personalForm.name.trim()) {
      showToast('Name is required.', 'error');
      setSaving(false);
      return;
    }
    if (!personalForm.email.trim() || !EMAIL_RE.test(personalForm.email)) {
      showToast('A valid email address is required.', 'error');
      setSaving(false);
      return;
    }

    const hasNewPassword = passwordForm.newPassword || passwordForm.confirmPassword || passwordForm.currentPassword;
    if (hasNewPassword) {
      if (passwordForm.newPassword.length < 6) {
        showToast('New password must be at least 6 characters.', 'error');
        setSaving(false);
        return;
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        showToast('Passwords do not match.', 'error');
        setSaving(false);
        return;
      }
      if (!passwordForm.currentPassword) {
        showToast('Current password is required to change your password.', 'error');
        setSaving(false);
        return;
      }
    }

    const token = localStorage.getItem('studentToken');
    if (!token) {
      showToast('Not logged in. Please sign in again.', 'error');
      window.location.href = '/student/login';
      setSaving(false);
      return;
    }

    try {
      const body = {
        name: personalForm.name.trim(),
        email: personalForm.email.trim().toLowerCase(),
        phone: personalForm.phone.trim(),
      };
      if (hasNewPassword) {
        body.currentPassword = passwordForm.currentPassword;
        body.newPassword = passwordForm.newPassword;
      }

      const res = await fetch(`${API_CONFIG.API_URL}/students/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        updateStudentUser(data.data.user);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showToast('Profile updated successfully.', 'success');
      } else {
        showToast(data.message || 'Failed to update profile.', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleImageSelected = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
    setSaving(true);

    const token = localStorage.getItem('studentToken');
    if (!token) {
      showToast('Not logged in. Please sign in again.', 'error');
      window.location.href = '/student/login';
      setSaving(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const res = await fetch(`${API_CONFIG.API_URL}/students/profile/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        updateStudentUser(data.data.user);
        setProfileImage(data.data.user.profileImage);
        showToast('Profile picture updated.', 'success');
      } else {
        showToast(data.message || 'Image upload failed.', 'error');
      }
    } catch {
      showToast('Network error. Could not upload image.', 'error');
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const initials = (studentUser?.name || 'S')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-brand-text">My Profile</h1>
      <p className="text-sm text-brand-muted mt-1">Manage your profile picture, personal details, and password.</p>

      {studentUser && (
        <div className="mt-6 space-y-8">
          <form onSubmit={handleSavePersonal} className="bg-white rounded-xl border border-brand-border p-6 space-y-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 shrink-0">
                {profileImage ? (
                  <img src={getImageUrl(profileImage)} alt="Profile" className="w-20 h-20 rounded-full object-cover border border-brand-border" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center font-bold text-lg border border-brand-border">
                    {initials}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handlePickImage}
                  disabled={saving}
                  className="absolute bottom-0 right-0 rounded-full bg-brand-navy text-white p-1 border-2 border-white shadow-xs disabled:opacity-60"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z" />
                  </svg>
                </button>
              </div>
              <div>
                <p className="text-sm font-medium text-brand-text">{studentUser?.name || 'Student'}</p>
                <p className="text-xs text-brand-muted">{studentUser?.studentId || 'ST-2026'}</p>
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelected} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-brand-muted mb-1">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={personalForm.name}
                  onChange={handlePersonalChange}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-brand-muted mb-1">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={personalForm.email}
                  onChange={handlePersonalChange}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-brand-muted mb-1">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={personalForm.phone}
                  onChange={handlePersonalChange}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1">Role</label>
                <input type="text" value="Student" disabled className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-muted bg-brand-soft" />
              </div>
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-brand-text">Change Password</legend>
              <p className="text-xs text-brand-muted">Leave blank if you do not want to change your password.</p>
              <div>
                <label htmlFor="currentPassword" className="block text-xs font-semibold text-brand-muted mb-1">Current Password</label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-xs font-semibold text-brand-muted mb-1">New Password</label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-brand-muted mb-1">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
                />
              </div>
            </fieldset>

            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-brand-navy text-white text-sm font-semibold hover:bg-brand-navyHover disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
