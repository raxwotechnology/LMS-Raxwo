import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Role from '@/lib/models/Role';

export async function GET(request) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    await connectDB();
    const roles = await Role.find().sort({ name: 1 });

    return NextResponse.json({
      success: true,
      data: roles.map(role => ({
        id: role._id,
        name: role.name
      }))
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
    const { name } = body;

    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'Role name is required'
      }, { status: 400 });
    }

    const roleExists = await Role.findOne({ name: name.trim() });
    if (roleExists) {
      return NextResponse.json({
        success: false,
        message: 'Role already exists'
      }, { status: 400 });
    }

    const role = await Role.create({ name: name.trim() });

    return NextResponse.json({
      success: true,
      message: 'Role created successfully',
      data: {
        id: role._id,
        name: role.name
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
