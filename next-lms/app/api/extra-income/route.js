import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import ExtraIncome from '@/lib/models/ExtraIncome';

export async function GET(request) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const months = searchParams.get('months');

    await connectDB();
    let query = {};

    if (months) {
      const monthArray = months.includes(',') ? months.split(',') : [months];
      query.month = { $in: monthArray.map(m => m.trim()) };
    }

    const extraIncomes = await ExtraIncome.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: extraIncomes.length,
      data: extraIncomes
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { title, description, amount, year, month } = body;

    if (!title || !amount || !year || !month) {
      return NextResponse.json({
        success: false,
        message: 'Please provide all required fields (title, amount, year, month)'
      }, { status: 400 });
    }

    const extraIncome = await ExtraIncome.create({
      title,
      description: description || '',
      amount,
      year: String(year),
      month
    });

    return NextResponse.json({
      success: true,
      message: 'Extra income record created successfully',
      data: extraIncome
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
