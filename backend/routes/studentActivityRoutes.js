import express from 'express';
import {
  getStudentActivities,
  getStudentActivityById,
  markStudentAttendance,
  markStudentExamAttendance
} from '../controllers/studentActivityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getStudentActivities);
router.post('/mark-attendance', markStudentAttendance);
router.post('/mark-exam-attendance', markStudentExamAttendance);
router.get('/:id', getStudentActivityById);

export default router;
