import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectsByTeacher,
  startClass
} from '../controllers/subjectController.js';
import { protect } from '../middleware/authMiddleware.js';

import fs from 'fs';
import { fileURLToPath } from 'url';

import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads folder exists
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

// Configure Multer for local file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${cleanOriginalName}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

const router = express.Router();

// Public routes
router.route('/')
  .get(getSubjects)
  .post(protect, upload.single('image'), createSubject);

router.route('/teacher/:teacherId')
  .get(protect, getSubjectsByTeacher);

// This route MUST come before /:id to prevent "start-class" from being treated as an ID
router.route('/:id/start-class')
  .post(protect, startClass);

router.route('/:id')
  .get(getSubject)
  .put(protect, upload.single('image'), updateSubject)
  .delete(protect, deleteSubject);

export default router;

