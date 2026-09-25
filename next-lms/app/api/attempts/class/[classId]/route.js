import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attempt from '@/lib/models/Attempt';

export async function GET(request, { params }) {
  try {
    const { classId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    await connectDB();

    const query = { classId };
    if (status) {
      query.status = status;
    }

    const attempts = await Attempt.find(query).sort({ createdAt: -1 });

    const activeCount = status === 'active' || !status 
      ? await Attempt.countDocuments({ classId, status: 'active' })
      : attempts.length;

    return NextResponse.json({
      success: true,
      count: status ? attempts.length : activeCount,
      activeCount: await Attempt.countDocuments({ classId, status: 'active' }),
      leftCount: await Attempt.countDocuments({ classId, status: 'left' }),
      totalCount: await Attempt.countDocuments({ classId }),
      data: attempts
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
