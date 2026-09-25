import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Subject from '@/lib/models/Subject';
import { handleFileUpload, deleteLocalFile } from '@/lib/upload';

export async function GET() {
  try {
    await connectDB();
    const subjects = await Subject.find()
      .populate('conductedBy', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  let uploadedFilePath = null;
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    await connectDB();

    const contentType = request.headers.get('content-type') || '';
    let name, conductedBy, price, description, image = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name = formData.get('name');
      conductedBy = formData.get('conductedBy');
      price = formData.get('price');
      description = formData.get('description');
      
      const file = formData.get('image');
      if (file && typeof file === 'object' && file.size > 0) {
        image = await handleFileUpload(file);
        uploadedFilePath = image;
      } else if (typeof formData.get('image') === 'string') {
        image = formData.get('image');
      }
    } else {
      const body = await request.json();
      name = body.name;
      conductedBy = body.conductedBy;
      price = body.price;
      description = body.description;
      image = body.image || '';
    }

    if (!name || !conductedBy || !description) {
      if (uploadedFilePath) deleteLocalFile(uploadedFilePath);
      return NextResponse.json({
        success: false,
        message: 'Please provide all required fields (name, conductedBy, description)'
      }, { status: 400 });
    }

    const subjectExists = await Subject.findOne({ name });
    if (subjectExists) {
      if (uploadedFilePath) deleteLocalFile(uploadedFilePath);
      return NextResponse.json({
        success: false,
        message: 'Subject already exists with this name'
      }, { status: 400 });
    }

    const subject = await Subject.create({
      name,
      conductedBy,
      price: price || undefined,
      image,
      description
    });

    await subject.populate('conductedBy', 'name');

    return NextResponse.json({
      success: true,
      message: 'Subject created successfully',
      data: subject
    }, { status: 201 });
  } catch (error) {
    if (uploadedFilePath) deleteLocalFile(uploadedFilePath);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
