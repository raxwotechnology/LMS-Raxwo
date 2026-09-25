import Admin from '../models/Admin.js';
import Employee from '../models/Employee.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: pick the right model based on the logged-in user's type
const getModel = (userType) => (userType === 'admin' ? Admin : Employee);

// @desc    Get the logged-in admin/employee's own profile
// @route   GET /api/admin/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const Model = getModel(req.userType);
    const user = await Model.findById(req.user._id || req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          type: req.userType,
          profileImage: user.profileImage || '',
          status: user.status
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update the logged-in admin/employee's own personal details
// @route   PUT /api/admin/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const Model = getModel(req.userType);
    const user = await Model.findById(req.user._id || req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, phone, currentPassword, newPassword } = req.body;

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    if (email && email !== user.email) {
      const existing = await Model.findOne({ email, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email is already in use' });
      }
      user.email = email;
    }

    // Changing password requires confirming the current one
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to set a new password' });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      user.password = newPassword;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          type: req.userType,
          profileImage: user.profileImage || ''
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload / change the logged-in admin/employee's profile picture
// @route   POST /api/admin/profile/image
// @access  Private
export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const Model = getModel(req.userType);
    const user = await Model.findById(req.user._id || req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Remove the old profile image from disk if it was a local upload
    if (user.profileImage && user.profileImage.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', user.profileImage);
      fs.unlink(oldPath, () => {});
    }

    user.profileImage = `/uploads/${req.file.filename}`;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      data: { profileImage: user.profileImage }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};