import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Class from '@/lib/models/Class';

export async function DELETE(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const classInstance = await Class.findById(id);

    if (!classInstance) {
      return NextResponse.json({ success: false, message: 'Class not found' }, { status: 404 });
    }

    await classInstance.deleteOne();

    return NextResponse.json({
      success: true,
      message: 'Class removed permanently'
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
