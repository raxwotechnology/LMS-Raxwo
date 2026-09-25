import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API_CONFIG from '../config/api';
import { getImageUrl } from '../utils/imageUtils';
import defaultLogo from '../assets/logo.png';

const SettingsContext = createContext(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [instituteName, setInstituteName] = useState('WISDOM INSTITUTE');
  const [instituteLogo, setInstituteLogo] = useState(''); // raw path from server
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_CONFIG.API_URL}/settings`);
      const data = await res.json();
      if (data.success) {
        setInstituteName(data.data.instituteName || 'WISDOM INSTITUTE');
        setInstituteLogo(data.data.instituteLogo || '');
      }
    } catch (err) {
      // Silently keep defaults if the settings endpoint isn't reachable
      console.error('Failed to load institute settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const logoUrl = instituteLogo ? getImageUrl(instituteLogo) : defaultLogo;

  const value = {
    instituteName,
    instituteLogo,
    logoUrl,
    loading,
    refreshSettings: fetchSettings,
    // Allow the profile page to push a fresh value immediately after saving,
    // without waiting for a refetch.
    setInstituteNameLocal: setInstituteName,
    setInstituteLogoLocal: setInstituteLogo
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;