import Settings from '../models/Settings.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getSettingsData = (settings) => ({
  instituteName: settings?.instituteName || 'WISDOM INSTITUTE',
  instituteLogo: settings?.instituteLogo || ''
});

export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: getSettingsData(settings)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const instituteName = req.body.instituteName?.trim();

    if (!instituteName) {
      return res.status(400).json({
        success: false,
        message: 'Institute name is required'
      });
    }

    let settings = await Settings.findOne().sort({ createdAt: -1 });

    if (settings) {
      settings.instituteName = instituteName;
      await settings.save();
    } else {
      settings = await Settings.create({ instituteName });
    }

    res.status(200).json({
      success: true,
      message: 'Institute settings updated successfully',
      data: getSettingsData(settings)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const uploadInstituteLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No logo file provided'
      });
    }

    const instituteLogo = `/uploads/${req.file.filename}`;
    let settings = await Settings.findOne().sort({ createdAt: -1 });

    if (settings?.instituteLogo?.startsWith('/uploads/')) {
      const oldLogoPath = path.join(__dirname, '..', settings.instituteLogo);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    if (settings) {
      settings.instituteLogo = instituteLogo;
      await settings.save();
    } else {
      settings = await Settings.create({ instituteLogo });
    }

    res.status(200).json({
      success: true,
      message: 'Institute logo updated successfully',
      data: getSettingsData(settings)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
