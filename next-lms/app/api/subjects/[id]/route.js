import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Subject from '@/lib/models/Subject';
import { handleFileUpload, deleteLocalFile } from '@/lib/upload';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    const subject = await Subject.findById(id).populate('conductedBy', 'name');

    if (!subject) {
      return NextResponse.json({ success: false, message: 'Subject not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: subject });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  let uploadedFilePath = null;
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    let subject = await Subject.findById(id);
    if (!subject) {
      return NextResponse.json({ success: false, message: 'Subject not found' }, { status: 404 });
    }

    const contentType = request.headers.get('content-type') || '';
    let name, conductedBy, price, description, status, imageProvided = false, newImage = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name = formData.get('name');
      conductedBy = formData.get('conductedBy');
      price = formData.get('price');
      description = formData.get('description');
      status = formData.get('status');

      const file = formData.get('image');
      if (file && typeof file === 'object' && file.size > 0) {
        newImage = await handleFileUpload(file);
        uploadedFilePath = newImage;
        imageProvided = true;
      } else if (typeof formData.get('image') === 'string') {
        newImage = formData.get('image');
        imageProvided = true;
      }
    } else {
      const body = await request.json();
      name = body.name;
      conductedBy = body.conductedBy;
      price = body.price;
      description = body.description;
      status = body.status;
      if (body.image !== undefined) {
        newImage = body.image;
        imageProvided = true;
      }
    }

    if (name) subject.name = name;
    if (conductedBy) subject.conductedBy = conductedBy;
    if (price !== undefined) subject.price = price;
    if (description) subject.description = description;
    if (status) subject.status = status;

    const oldImage = subject.image;
    if (imageProvided) {
      subject.image = newImage;
      if (oldImage && oldImage.startsWith('/uploads/') && oldImage !== newImage) {
        deleteLocalFile(oldImage);
      }
    }

    await subject.save();
    await subject.populate('conductedBy', 'name');

    return NextResponse.json({
      success: true,
      message: 'Subject updated successfully',
      data: subject
    });
  } catch (error) {
    if (uploadedFilePath) deleteLocalFile(uploadedFilePath);
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
    const subject = await Subject.findById(id);

    if (!subject) {
      return NextResponse.json({ success: false, message: 'Subject not found' }, { status: 404 });
    }

    if (subject.image && subject.image.startsWith('/uploads/')) {
      deleteLocalFile(subject.image);
    }

    await subject.deleteOne();

    return NextResponse.json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
