import express from 'express';
import {
  getMarks,
  getMarksByStudentId,
  validateStudent,
  createMarks,
  updateMarks,
  deleteMarks
} from '../controllers/marksController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for students to view their own marks
router.route('/student/:studentId')
  .get(getMarksByStudentId);

// All other routes require authentication
router.use(protect);

router.route('/validate-student/:studentId')
  .get(validateStudent);

router.route('/')
  .get(getMarks)
  .post(createMarks);

router.route('/:id')
  .put(updateMarks)
  .delete(deleteMarks);

export default router;

