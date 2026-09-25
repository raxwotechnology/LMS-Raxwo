import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!uri || uri.includes('<db_password>')) {
  console.error('\n❌ Error: Please set your actual MongoDB password in next-lms/.env.local before running this script.\n');
  process.exit(1);
}

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  status: { type: String, default: 'active' }
}, { timestamps: true });

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

async function seedAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected successfully!');

    const email = 'admin@lms.com';
    const rawPassword = 'admin@123';

    let admin = await Admin.findOne({ email });

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    if (admin) {
      admin.password = hashedPassword;
      admin.status = 'active';
      await admin.save();
      console.log(`\n Admin account updated successfully!`);
    } else {
      admin = await Admin.create({
        name: 'System Admin',
        email,
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      });
      console.log(`\n Admin account created successfully!`);
    }

    console.log(`-----------------------------------`);
    console.log(` Email:    ${email}`);
    console.log(` Password: ${rawPassword}`);
    console.log(` Role:     ${admin.role}`);
    console.log(`-----------------------------------\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

seedAdmin();
