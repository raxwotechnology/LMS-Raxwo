import express from 'express';
import {
  getExamPapers,
  getExamPaper,
  getExamPapersForStudent,
  createExamPaper,
  updateExamPaper,
  deleteExamPaper
} from '../controllers/examPaperController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public - student-specific papers (MUST be before /:id)
router.get('/for-student/:identifier', getExamPapersForStudent);

// Public - read all / single
router.get('/', getExamPapers);
router.get('/:id', getExamPaper);

// Protected - write
router.post('/', protect, createExamPaper);
router.put('/:id', protect, updateExamPaper);
router.delete('/:id', protect, deleteExamPaper);

export default router;
