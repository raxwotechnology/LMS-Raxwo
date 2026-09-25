import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import Student from '@/lib/models/Student';

export async function GET(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { studentId: identifier } = await params;
    const searchTerm = identifier.trim();

    await connectDB();

    let student = await Student.findOne({ studentId: searchTerm })
      .populate('subjects', 'name _id');

    if (!student) {
      const allStudents = await Student.find().select('name studentId subjects');
      
      student = allStudents.find(s => {
        const studentName = (s.name || '').trim().toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        const nameParts = studentName.split(/\s+/).filter(part => part.length > 0);
        const firstName = nameParts.length > 0 ? nameParts[0] : '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        
        const matchesFirstName = firstName && searchLower === firstName;
        const matchesLastName = lastName && searchLower === lastName;
        const matchesFullName = searchLower === studentName;
        
        const searchParts = searchLower.split(/\s+/).filter(part => part.length > 0);
        const matchesReversed = searchParts.length === nameParts.length && 
          searchParts.length === 2 &&
          searchParts[0] === nameParts[1] && 
          searchParts[1] === nameParts[0];
        
        return matchesFirstName || matchesLastName || matchesFullName || matchesReversed;
      });
      
      if (student) {
        await student.populate('subjects', 'name _id');
      }
    }

    if (!student) {
      return NextResponse.json({
        success: false,
        message: 'Student not found. Please enter a valid Student ID, first name, last name, or full name.',
        valid: false
      }, { status: 404 });
    }

    let populatedSubjects = student.subjects;
    if (student.subjects && student.subjects.length > 0 && typeof student.subjects[0] === 'object' && student.subjects[0]._id) {
      populatedSubjects = student.subjects;
    } else if (student.subjects && student.subjects.length > 0) {
      await student.populate('subjects', 'name _id');
      populatedSubjects = student.subjects;
    }

    return NextResponse.json({
      success: true,
      valid: true,
      data: {
        studentId: student._id,
        name: student.name,
        studentIdField: student.studentId,
        subjects: populatedSubjects
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
