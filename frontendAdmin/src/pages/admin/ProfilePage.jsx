import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import API_CONFIG from '../../config/api';
import { useNotification } from '../../context/NotificationContext';
import { useSettings } from '../../context/SettingsContext';
import { getImageUrl } from '../../utils/imageUtils';
import './ProfilePage.css';

const ProfilePage = () => {
  const { showSuccess, showError } = useNotification();
  const { instituteName, logoUrl, setInstituteNameLocal, setInstituteLogoLocal, refreshSettings } = useSettings();
  const location = useLocation();

  const token = localStorage.getItem('adminToken');
  const userType = localStorage.getItem('userType');
  const isAdmin = userType === 'admin';

  const [activeTab, setActiveTab] = useState(
    location.state && location.state.tab === 'institute' && isAdmin ? 'institute' : 'personal'
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    profileImage: ''
  });

  const [personalForm, setPersonalForm] = useState({ name: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [instituteForm, setInstituteForm] = useState({ instituteName: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setInstituteForm({ instituteName });
  }, [instituteName]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_CONFIG.API_URL}/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const u = data.data.user;
        setProfile(u);
        setPersonalForm({ name: u.name || '', email: u.email || '', phone: u.phone || '' });
      } else {
        showError('Failed to load profile', data.message || '');
      }
    } catch (err) {
      showError('Network error', 'Could not load your profile.');
    } finally {
      setLoading(false);
    }
  };

  // Broadcast the updated user object so the Sidebar/Topbar refresh instantly
  const broadcastUserUpdate = (updatedFields) => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const merged = { ...storedUser, ...updatedFields };
    localStorage.setItem('user', JSON.stringify(merged));
    window.dispatchEvent(new Event('profile-updated'));
  };

  const handlePersonalChange = (e) => {
    setPersonalForm({ ...personalForm, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleSavePersonal = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword || passwordForm.confirmPassword || passwordForm.currentPassword) {
      if (passwordForm.newPassword.length > 0 && passwordForm.newPassword.length < 6) {
        showError('Weak password', 'New password must be at least 6 characters.');
        return;
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        showError('Passwords do not match', 'New password and confirm password must match.');
        return;
      }
      if (passwordForm.newPassword && !passwordForm.currentPassword) {
        showError('Current password required', 'Please enter your current password to set a new one.');
        return;
      }
    }

    setSaving(true);
    try {
      const body = {
        name: personalForm.name,
        email: personalForm.email,
        phone: personalForm.phone
      };
      if (passwordForm.newPassword) {
        body.currentPassword = passwordForm.currentPassword;
        body.newPassword = passwordForm.newPassword;
      }

      const res = await fetch(`${API_CONFIG.API_URL}/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setProfile((prev) => ({ ...prev, ...data.data.user }));
        broadcastUserUpdate({
          name: data.data.user.name,
          email: data.data.user.email
        });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showSuccess('Profile Updated', 'Your personal details have been saved.');
      } else {
        showError('Update Failed', data.message || 'Could not update your profile.');
      }
    } catch (err) {
      showError('Network error', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = () => {
    fileInputRef.current && fileInputRef.current.click();
  };

  const handleImageSelected = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const res = await fetch(`${API_CONFIG.API_URL}/admin/profile/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setProfile((prev) => ({ ...prev, profileImage: data.data.profileImage }));
        broadcastUserUpdate({ profileImage: data.data.profileImage });
        showSuccess('Profile Picture Updated', 'Your new photo has been saved.');
      } else {
        showError('Upload Failed', data.message || 'Could not upload the image.');
      }
    } catch (err) {
      showError('Network error', 'Could not upload the image.');
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleInstituteNameChange = (e) => {
    setInstituteForm({ instituteName: e.target.value });
  };

  const handleSaveInstitute = async (e) => {
    e.preventDefault();
    if (!instituteForm.instituteName.trim()) {
      showError('Name required', 'Institute name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_CONFIG.API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ instituteName: instituteForm.instituteName })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setInstituteNameLocal(data.data.instituteName);
        showSuccess('Institute Updated', 'The institute name has been saved.');
      } else {
        showError('Update Failed', data.message || 'Could not update institute settings.');
      }
    } catch (err) {
      showError('Network error', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePickLogo = () => {
    logoInputRef.current && logoInputRef.current.click();
  };

  const handleLogoSelected = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const res = await fetch(`${API_CONFIG.API_URL}/settings/logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setInstituteLogoLocal(data.data.instituteLogo);
        showSuccess('Logo Updated', 'The institute logo has been saved.');
        refreshSettings();
      } else {
        showError('Upload Failed', data.message || 'Could not upload the logo.');
      }
    } catch (err) {
      showError('Network error', 'Could not upload the logo.');
    } finally {
      setSaving(false);
      setLogoFile(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const initials = (profile.name || 'A').trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="profile-page">
      <Sidebar />
      <div className="profile-main-content">
        <Topbar userName={profile.name} />

        <div className="profile-content">
          <div className="profile-header">
            <h1>My Profile</h1>
            <p className="profile-subtitle">Manage your personal details, photo and institute branding</p>
          </div>

          <div className="profile-tabs">
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              Personal Details
            </button>
            {isAdmin && (
              <button
                type="button"
                className={`profile-tab-btn ${activeTab === 'institute' ? 'active' : ''}`}
                onClick={() => setActiveTab('institute')}
              >
                Institute Settings
              </button>
            )}
          </div>

          {loading ? (
            <div className="profile-loading">Loading profile...</div>
          ) : (
            <>
              {activeTab === 'personal' && (
                <div className="profile-card">
                  <div className="profile-picture-section">
                    <div className="profile-picture-wrapper" onClick={handlePickImage} title="Change profile picture">
                      {profile.profileImage ? (
                        <img src={getImageUrl(profile.profileImage)} alt="Profile" className="profile-picture-img" />
                      ) : (
                        <div className="profile-picture-fallback">{initials}</div>
                      )}
                      <div className="profile-picture-overlay">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageSelected}
                    />
                    <div className="profile-picture-meta">
                      <button type="button" className="change-photo-btn" onClick={handlePickImage} disabled={saving}>
                        Change Photo
                      </button>
                      <span className="profile-picture-hint">JPG, PNG, GIF or WEBP. Max 5MB.</span>
                    </div>
                  </div>

                  <form className="profile-form" onSubmit={handleSavePersonal}>
                    <h3 className="profile-section-title">Personal Details</h3>
                    <div className="profile-form-row">
                      <div className="profile-form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={personalForm.name}
                          onChange={handlePersonalChange}
                          required
                        />
                      </div>
                      <div className="profile-form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={personalForm.email}
                          onChange={handlePersonalChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="profile-form-row">
                      <div className="profile-form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input
                          type="text"
                          id="phone"
                          name="phone"
                          placeholder="e.g. 077 123 4567"
                          value={personalForm.phone}
                          onChange={handlePersonalChange}
                        />
                      </div>
                      <div className="profile-form-group">
                        <label>Role</label>
                        <input type="text" value={isAdmin ? 'Administrator' : (profile.role || 'Staff')} disabled />
                      </div>
                    </div>

                    <h3 className="profile-section-title">Change Password</h3>
                    <p className="profile-section-hint">Leave blank if you don't want to change your password.</p>
                    <div className="profile-form-row">
                      <div className="profile-form-group">
                        <label htmlFor="currentPassword">Current Password</label>
                        <input
                          type="password"
                          id="currentPassword"
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordChange}
                          autoComplete="current-password"
                        />
                      </div>
                    </div>
                    <div className="profile-form-row">
                      <div className="profile-form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <input
                          type="password"
                          id="newPassword"
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          autoComplete="new-password"
                        />
                      </div>
                      <div className="profile-form-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          autoComplete="new-password"
                        />
                      </div>
                    </div>

                    <div className="profile-form-actions">
                      <button type="submit" className="profile-save-btn" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'institute' && isAdmin && (
                <div className="profile-card">
                  <div className="profile-picture-section">
                    <div className="profile-picture-wrapper institute-logo-wrapper" onClick={handlePickLogo} title="Change institute logo">
                      <img src={logoPreview || logoUrl} alt="Institute Logo" className="profile-picture-img" />
                      <div className="profile-picture-overlay">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={logoInputRef}
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleLogoSelected}
                    />
                    <div className="profile-picture-meta">
                      <button type="button" className="change-photo-btn" onClick={handlePickLogo} disabled={saving}>
                        Change Logo
                      </button>
                      <span className="profile-picture-hint">Shown on the sidebar across the admin portal.</span>
                    </div>
                  </div>

                  <form className="profile-form" onSubmit={handleSaveInstitute}>
                    <h3 className="profile-section-title">Institute Details</h3>
                    <div className="profile-form-row">
                      <div className="profile-form-group">
                        <label htmlFor="instituteName">Institute Name</label>
                        <input
                          type="text"
                          id="instituteName"
                          name="instituteName"
                          value={instituteForm.instituteName}
                          onChange={handleInstituteNameChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="profile-form-actions">
                      <button type="submit" className="profile-save-btn" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Institute Name'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;