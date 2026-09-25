import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import ExtraIncome from '@/lib/models/ExtraIncome';

export async function GET(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const extraIncome = await ExtraIncome.findById(id);

    if (!extraIncome) {
      return NextResponse.json({ success: false, message: 'Extra income record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: extraIncome });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const body = await request.json();
    const { title, description, amount, year, month } = body;

    let extraIncome = await ExtraIncome.findById(id);
    if (!extraIncome) {
      return NextResponse.json({ success: false, message: 'Extra income record not found' }, { status: 404 });
    }

    if (title) extraIncome.title = title;
    if (description !== undefined) extraIncome.description = description;
    if (amount !== undefined) extraIncome.amount = amount;
    if (year) extraIncome.year = String(year);
    if (month) extraIncome.month = month;

    await extraIncome.save();

    return NextResponse.json({
      success: true,
      message: 'Extra income record updated successfully',
      data: extraIncome
    });
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
    const extraIncome = await ExtraIncome.findById(id);

    if (!extraIncome) {
      return NextResponse.json({ success: false, message: 'Extra income record not found' }, { status: 404 });
    }

    await extraIncome.deleteOne();

    return NextResponse.json({
      success: true,
      message: 'Extra income record deleted successfully'
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
