import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  year: { type: String, required: true },
  month: { type: String, required: true },
  type: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: false },
}, { timestamps: true });

ExpenseSchema.index({ year: 1, month: 1, type: 1 });

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
