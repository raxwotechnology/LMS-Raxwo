import express from 'express';
import {
  submitExamPaper,
  getAllSubmissions,
  getStudentSubmissions,
  getSubmission,
  deleteSubmission
} from '../controllers/examPaperSubmissionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Student submits a paper (public — student is not admin-authed)
router.post('/', submitExamPaper);

// Get all submissions (admin view)
router.get('/', getAllSubmissions);

// Get submissions by student
router.get('/student/:studentId', getStudentSubmissions);

// Single submission
router.get('/:id', getSubmission);

// Delete (admin)
router.delete('/:id', protect, deleteSubmission);

export default router;
