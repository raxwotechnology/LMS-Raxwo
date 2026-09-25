import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const uri = process.env.MONGO_URI;

async function setup() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // 1. Admin account
  const adminCollection = mongoose.connection.db.collection('admins');
  const adminEmail = 'admin@lms.com';
  const adminPassword = 'admin123';
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await adminCollection.findOne({ email: adminEmail });
  if (existingAdmin) {
    await adminCollection.updateOne(
      { email: adminEmail },
      { $set: { password: hashedAdminPassword, status: 'active', role: 'admin' } }
    );
    console.log(`Updated Admin credentials for ${adminEmail}`);
  } else {
    await adminCollection.insertOne({
      name: 'System Admin',
      email: adminEmail,
      password: hashedAdminPassword,
      role: 'admin',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`Created new Admin account: ${adminEmail}`);
  }

  // 2. Student account
  const studentCollection = mongoose.connection.db.collection('students');
  const studentEmail = 'student@lms.com';
  const studentId = 'STU001';
  const studentPassword = 'student123';
  const hashedStudentPassword = await bcrypt.hash(studentPassword, 10);

  const existingStudent = await studentCollection.findOne({ 
    $or: [{ email: studentEmail }, { studentId }] 
  });

  if (existingStudent) {
    await studentCollection.updateOne(
      { _id: existingStudent._id },
      { $set: { password: hashedStudentPassword, isRegistered: true } }
    );
    console.log(`Updated Student credentials for ${existingStudent.email || studentEmail} (${existingStudent.studentId})`);
  } else {
    await studentCollection.insertOne({
      name: 'Sample Student',
      studentId: studentId,
      email: studentEmail,
      birthday: new Date('2005-01-01'),
      gender: 'Male',
      grade: 'Grade 12',
      mobile: '0771234567',
      password: hashedStudentPassword,
      isRegistered: true,
      subjects: [],
      createdAt: new Date()
    });
    console.log(`Created new Student account: ${studentEmail} (Student ID: ${studentId})`);
  }

  // Also create/update student account for admin@lms.com so it works on both portals
  const adminStudent = await studentCollection.findOne({ email: adminEmail });
  if (adminStudent) {
    await studentCollection.updateOne(
      { _id: adminStudent._id },
      { $set: { password: hashedAdminPassword, isRegistered: true } }
    );
    console.log(`Updated Student account for ${adminEmail}`);
  } else {
    await studentCollection.insertOne({
      name: 'System Admin',
      studentId: 'ADMIN-01',
      email: adminEmail,
      birthday: new Date('1995-01-01'),
      gender: 'Male',
      grade: 'Staff',
      mobile: '0770000000',
      password: hashedAdminPassword,
      isRegistered: true,
      subjects: [],
      createdAt: new Date()
    });
    console.log(`Created Student account for ${adminEmail} (Student ID: ADMIN-01)`);
  }

  // Also update existing student shanl@gmail.com with student123 for convenience
  const shanl = await studentCollection.findOne({ email: 'shanl@gmail.com' });
  if (shanl) {
    await studentCollection.updateOne(
      { _id: shanl._id },
      { $set: { password: hashedStudentPassword, isRegistered: true } }
    );
    console.log(`Updated password for existing student shanl@gmail.com (${shanl.studentId}) to student123`);
  }

  console.log('\n--- CREDENTIALS READY ---');
  await mongoose.disconnect();
}

setup().catch(console.error);
