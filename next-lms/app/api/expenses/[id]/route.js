import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Expense from '@/lib/models/Expense';

export async function PUT(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const body = await request.json();
    const { year, month, type, price } = body;

    const doc = await Expense.findByIdAndUpdate(
      id,
      { year: String(year), month, type, price: Number(price) },
      { new: true, runValidators: true }
    );

    if (!doc) {
      return NextResponse.json({ success: false, message: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const doc = await Expense.findByIdAndDelete(id);

    if (!doc) {
      return NextResponse.json({ success: false, message: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
