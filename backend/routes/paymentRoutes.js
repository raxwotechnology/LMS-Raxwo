import express from 'express';
import {
  createPayment,
  getPayments,
  getPayment,
  getPaymentsByStudent,
  updatePayment,
  deletePayment
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for student to view their own payments
router.route('/student/:studentId')
  .get(getPaymentsByStudent);

// All other routes require authentication
router.use(protect);

router.route('/')
  .get(getPayments)
  .post(createPayment);

router.route('/:id')
  .get(getPayment)
  .put(updatePayment)
  .delete(deletePayment);

export default router;

