import mongoose from 'mongoose';

// Singleton-style collection: there will only ever be one document here,
// holding institute-wide branding (name + logo) shown across the admin portal.
const settingsSchema = new mongoose.Schema({
  instituteName: {
    type: String,
    trim: true,
    default: 'WISDOM INSTITUTE'
  },
  instituteLogo: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;