import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  addSubjectToStudent,
  removeSubjectFromStudent,
  searchStudentsForAutocomplete,
  studentAuthSignup,
  studentAuthSignin,
  getStudentPortalProfile,
  getStudentProfile,
  updateStudentProfile,
  uploadStudentProfileImage
} from '../controllers/studentController.js';
import { protect, protectStudent } from '../middleware/authMiddleware.js';

const router = express.Router();

import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(__dirname, '../uploads');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  // Ignored in read-only serverless environments
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `student-profile-${uniqueSuffix}-${cleanOriginalName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Invalid file type. Only images are allowed.'));
  }
});

// Public routes for student portal & autocomplete (must be before protect middleware)
router.get('/search/autocomplete', searchStudentsForAutocomplete);
router.post('/auth/signup', studentAuthSignup);
router.post('/auth/signin', studentAuthSignin);
router.get('/portal/:identifier', getStudentPortalProfile);

// Student account routes
router.get('/profile', protectStudent, getStudentProfile);
router.put('/profile', protectStudent, updateStudentProfile);
router.post('/profile/image', protectStudent, upload.single('profileImage'), uploadStudentProfileImage);

// All admin student-management routes require staff authentication
router.use(protect);

router.route('/')
  .get(getStudents)
  .post(createStudent);

router.post('/:id/add-subject', addSubjectToStudent);
router.post('/:id/remove-subject', removeSubjectFromStudent);

router.route('/:id')
  .get(getStudent)
  .put(updateStudent)
  .delete(deleteStudent);

export default router;

