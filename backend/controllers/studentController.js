import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import Payment from '../models/Payment.js';

const generateStudentToken = (id) => jwt.sign(
  { id, userType: 'student' },
  process.env.JWT_SECRET || 'your-secret-key',
  { expiresIn: '7d' }
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getStudentProfileData = (student) => ({
  id: student._id,
  name: student.name,
  email: student.email || '',
  phone: student.mobile || '',
  studentId: student.studentId,
  username: student.username || '',
  profileImage: student.profileImage || '',
  subjects: student.subjects || [],
  totalPrice: student.totalPrice || 0,
  role: 'student',
  type: 'student'
});

export const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.student._id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: getStudentProfileData(student)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.student._id).select('+password');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const { name, email, phone, currentPassword, newPassword } = req.body;
    const cleanName = name?.trim();
    const cleanEmail = email?.trim().toLowerCase();
    const cleanPhone = phone?.trim() || '';

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required'
      });
    }

    student.name = cleanName;
    student.email = cleanEmail;
    student.mobile = cleanPhone;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters'
        });
      }

      const isMatch = await student.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      student.password = newPassword.trim();
      student.isRegistered = true;
    }

    await student.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: getStudentProfileData(student)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const uploadStudentProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const student = await Student.findById(req.student._id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (student.profileImage && student.profileImage.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', student.profileImage);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    student.profileImage = `/uploads/${req.file.filename}`;
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        profileImage: student.profileImage,
        user: getStudentProfileData(student)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all students
// @route   GET /api/students
// @access  Private
export const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate('subjects', 'name price')
      .populate('subjectPrices.subjectId', 'name price')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
export const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('subjects', 'name price')
      .populate('subjectPrices.subjectId', 'name price');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create student
// @route   POST /api/students
// @access  Private
export const createStudent = async (req, res) => {
  try {
    const {
      name,
      studentId,
      email,
      birthday,
      gender,
      mobile,
      grade,
      guardianName,
      guardianRelationship,
      guardianTelephone,
      guardianEmail,
      guardianAddress,
      guardianFirstName,
      guardianLastName,
      subject,
      teacherName,
      classType,
      classDay,
      classTime,
      classLocation,
      username,
      password,
      registrationDate,
      registrationStatus,
      paymentStatus,
      admissionFee,
      monthlyClassFee,
      totalFee,
      subjects,
      subjectPrices,
      totalPrice,
      hasSpecialNeeds,
      specialNeed,
      specialNeedsDetails,
      paymentType
    } = req.body;

    // Validate required fields (Full name, birthday, gender)
    if (!name || !birthday || !gender) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (Student Full Name, Birthday, Gender)'
      });
    }

    // Auto-generate student ID if not provided or if "Auto-generated" placeholder is passed
    let finalStudentId = studentId;
    if (!finalStudentId || finalStudentId.trim() === '' || finalStudentId === 'Auto-generated') {
      const existingStudents = await Student.find({
        studentId: { $regex: /^ID\d{4}$/ }
      }).sort({ studentId: -1 }).limit(1);

      let nextNumber = 1;
      if (existingStudents.length > 0) {
        const lastId = existingStudents[0].studentId;
        const lastNumber = parseInt(lastId.replace('ID', ''), 10);
        nextNumber = lastNumber + 1;
      }

      finalStudentId = `ID${String(nextNumber).padStart(4, '0')}`;
    }

    // Check if student ID already exists
    const studentExists = await Student.findOne({
      studentId: finalStudentId
    });

    if (studentExists) {
      return res.status(400).json({
        success: false,
        message: 'Student already exists with this Student ID'
      });
    }

    // Validate registration date if provided
    let finalRegistrationDate = new Date();
    if (registrationDate) {
      if (typeof registrationDate === 'string' && registrationDate.trim()) {
        const dateValue = new Date(registrationDate);
        if (!isNaN(dateValue.getTime())) {
          finalRegistrationDate = dateValue;
        }
      } else if (registrationDate instanceof Date) {
        finalRegistrationDate = registrationDate;
      }
    }

    // Parse guardian names
    let finalGuardianFirstName = guardianFirstName;
    let finalGuardianLastName = guardianLastName;
    if (guardianName && !guardianFirstName) {
      const parts = guardianName.trim().split(/\s+/);
      finalGuardianFirstName = parts.shift() || '';
      finalGuardianLastName = parts.join(' ') || '';
    }

    const finalMobile = (guardianTelephone || mobile || '').trim();
    const finalEmail = (email || username || guardianEmail || `${finalStudentId.toLowerCase()}@lms.local`).trim().toLowerCase();

    // Map subject to subjects array for backwards compatibility
    let finalSubjects = Array.isArray(subjects) ? [...subjects] : [];
    if (subject) {
      const foundSub = await Subject.findOne({
        $or: [
          ...(mongoose.Types.ObjectId.isValid(subject) ? [{ _id: subject }] : []),
          { name: { $regex: `^${subject.trim()}$`, $options: 'i' } }
        ]
      });
      if (foundSub && !finalSubjects.some(s => s.toString() === foundSub._id.toString())) {
        finalSubjects.push(foundSub._id);
      }
    }

    // Process subjectPrices: calculate totalPrice if provided
    let finalSubjectPrices = [];
    let finalTotalPrice = 0;

    if (subjectPrices && Array.isArray(subjectPrices) && subjectPrices.length > 0) {
      finalSubjectPrices = subjectPrices.map(sp => ({
        subjectId: sp.subjectId,
        price: parseFloat(sp.price) || 0
      }));
      finalTotalPrice = finalSubjectPrices.reduce((sum, sp) => sum + sp.price, 0);
    } else if (totalPrice !== undefined) {
      finalTotalPrice = Number(totalPrice) || 0;
    }

    let student;
    try {
      student = await Student.create({
        name: name.trim(),
        studentId: finalStudentId,
        email: finalEmail,
        birthday,
        gender,
        grade: grade ? grade.trim() : undefined,
        mobile: finalMobile,
        // 2. Parent / Guardian Details
        guardianName: guardianName ? guardianName.trim() : (finalGuardianFirstName ? `${finalGuardianFirstName} ${finalGuardianLastName}`.trim() : undefined),
        guardianRelationship: guardianRelationship ? guardianRelationship.trim() : undefined,
        guardianTelephone: guardianTelephone ? guardianTelephone.trim() : finalMobile,
        guardianEmail: guardianEmail ? guardianEmail.trim().toLowerCase() : undefined,
        guardianAddress: guardianAddress ? guardianAddress.trim() : undefined,
        guardianFirstName: finalGuardianFirstName,
        guardianLastName: finalGuardianLastName,
        // 3. Class Details
        subject: subject ? subject.trim() : undefined,
        teacherName: teacherName ? teacherName.trim() : undefined,
        classType: classType || 'Physical',
        classDay: classDay ? classDay.trim() : undefined,
        classTime: classTime ? classTime.trim() : undefined,
        classLocation: classLocation ? classLocation.trim() : undefined,
        // 4. Login Details (for LMS)
        username: username ? username.trim().toLowerCase() : undefined,
        password: password && password.trim() ? password.trim() : undefined,
        isRegistered: Boolean(password && password.trim()),
        // 5. Registration Details
        registrationDate: finalRegistrationDate,
        registrationStatus: registrationStatus || 'Active',
        paymentStatus: paymentStatus || 'Pending',
        admissionFee: parseFloat(admissionFee) || 0,
        monthlyClassFee: parseFloat(monthlyClassFee) || 0,
        totalFee: totalFee !== undefined ? (parseFloat(totalFee) || 0) : ((parseFloat(admissionFee) || 0) + (parseFloat(monthlyClassFee) || 0)),
        // Compatibility fields
        subjects: finalSubjects,
        subjectPrices: finalSubjectPrices,
        hasSpecialNeeds: hasSpecialNeeds || false,
        specialNeed: hasSpecialNeeds ? specialNeed : undefined,
        specialNeedsDetails: hasSpecialNeeds ? specialNeedsDetails : undefined,
        paymentType: paymentType || undefined,
        totalPrice: totalFee !== undefined ? (parseFloat(totalFee) || 0) : (((parseFloat(admissionFee) || 0) + (parseFloat(monthlyClassFee) || 0)) || finalTotalPrice)
      });
    } catch (createError) {
      if (createError.code === 11000 && createError.keyPattern && createError.keyPattern.email) {
        return res.status(400).json({
          success: false,
          message: 'The database still has a unique constraint on email. Please run scripts/removeEmailUniqueIndex.js'
        });
      }
      throw createError;
    }

    // Auto-create Payment record for registration admission & monthly fees
    const admFee = parseFloat(admissionFee) || 0;
    const monFee = parseFloat(monthlyClassFee) || 0;
    const totFee = totalFee !== undefined ? (parseFloat(totalFee) || 0) : (admFee + monFee);

    if (totFee > 0 || admFee > 0 || monFee > 0) {
      let pType = 'Monthly Fee';
      if (admFee > 0 && monFee > 0) pType = 'Admission & Monthly Fee';
      else if (admFee > 0) pType = 'Admission Fee';

      const regDate = finalRegistrationDate || new Date();
      const monthStr = regDate.toLocaleString('en-US', { month: 'long' });

      try {
        await Payment.create({
          studentId: student._id,
          studentIdNumber: finalStudentId,
          subjects: finalSubjects,
          totalAmount: totFee,
          admissionFee: admFee,
          monthlyFee: monFee,
          paymentType: pType,
          paymentStatus: paymentStatus || 'Paid',
          month: monthStr,
          paymentMethod: 'Cash',
          paymentDate: regDate,
          createdBy: req.user?._id || null,
          notes: `Registration Fee (${pType}) recorded on student admission`
        });
      } catch (payErr) {
        console.error('Error auto-creating registration payment record:', payErr);
      }
    }

    // Populate subjects before sending response
    await student.populate('subjects', 'name price');

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student
    });
  } catch (error) {
    console.error('Error creating student:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      let message = 'Duplicate entry';
      if (field === 'studentId') {
        message = 'This Student ID already exists. Please use a different Student ID.';
      } else {
        message = `${field} already exists`;
      }
      return res.status(400).json({
        success: false,
        message: message
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create student'
    });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
export const updateStudent = async (req, res) => {
  try {
    const {
      name,
      studentId,
      email,
      birthday,
      gender,
      mobile,
      grade,
      guardianName,
      guardianRelationship,
      guardianTelephone,
      guardianEmail,
      guardianAddress,
      guardianFirstName,
      guardianLastName,
      subject,
      teacherName,
      classType,
      classDay,
      classTime,
      classLocation,
      username,
      password,
      registrationDate,
      registrationStatus,
      paymentStatus,
      admissionFee,
      monthlyClassFee,
      totalFee,
      subjects,
      subjectPrices,
      totalPrice,
      hasSpecialNeeds,
      specialNeed,
      specialNeedsDetails,
      paymentType
    } = req.body;

    let student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (studentId && studentId !== student.studentId) {
      const studentIdExists = await Student.findOne({ studentId, _id: { $ne: student._id } });
      if (studentIdExists) {
        return res.status(400).json({
          success: false,
          message: 'Student ID already exists'
        });
      }
    }

    // Update 1. Student Details
    if (name) student.name = name.trim();
    if (studentId) student.studentId = studentId.trim();
    if (birthday) student.birthday = birthday;
    if (gender) student.gender = gender;
    if (grade !== undefined) student.grade = grade;

    // Update 2. Parent / Guardian Details
    if (guardianName !== undefined) {
      student.guardianName = guardianName;
      const parts = (guardianName || '').trim().split(/\s+/);
      student.guardianFirstName = parts.shift() || '';
      student.guardianLastName = parts.join(' ') || '';
    } else {
      if (guardianFirstName !== undefined) student.guardianFirstName = guardianFirstName;
      if (guardianLastName !== undefined) student.guardianLastName = guardianLastName;
    }
    if (guardianRelationship !== undefined) student.guardianRelationship = guardianRelationship;
    if (guardianTelephone !== undefined) {
      student.guardianTelephone = guardianTelephone;
      student.mobile = guardianTelephone;
    } else if (mobile) {
      student.mobile = mobile;
    }
    if (guardianEmail !== undefined) student.guardianEmail = guardianEmail;
    if (guardianAddress !== undefined) student.guardianAddress = guardianAddress;

    // Update 3. Class Details
    if (subject !== undefined) student.subject = subject;
    if (teacherName !== undefined) student.teacherName = teacherName;
    if (classType !== undefined) student.classType = classType;
    if (classDay !== undefined) student.classDay = classDay;
    if (classTime !== undefined) student.classTime = classTime;
    if (classLocation !== undefined) student.classLocation = classLocation;

    // Update 4. Login Details
    if (username !== undefined) student.username = username;
    if (email !== undefined) student.email = email;
    if (password && password.trim() !== '') {
      student.password = password.trim();
      student.isRegistered = true;
    }

    // Update 5. Registration Details
    if (registrationStatus !== undefined) student.registrationStatus = registrationStatus;
    if (paymentStatus !== undefined) student.paymentStatus = paymentStatus;
    if (admissionFee !== undefined) student.admissionFee = parseFloat(admissionFee) || 0;
    if (monthlyClassFee !== undefined) student.monthlyClassFee = parseFloat(monthlyClassFee) || 0;
    if (totalFee !== undefined) {
      student.totalFee = parseFloat(totalFee) || 0;
      student.totalPrice = student.totalFee;
    } else if (admissionFee !== undefined || monthlyClassFee !== undefined) {
      student.totalFee = (student.admissionFee || 0) + (student.monthlyClassFee || 0);
      student.totalPrice = student.totalFee;
    }
    if (registrationDate !== undefined && registrationDate !== null && registrationDate !== '') {
      const dateValue = new Date(registrationDate);
      if (!isNaN(dateValue.getTime())) {
        student.registrationDate = dateValue;
      }
    }

    // Handle subjects compatibility
    if (subjects !== undefined) {
      student.subjects = subjects;
    } else if (subject) {
      const foundSub = await Subject.findOne({
        $or: [
          ...(mongoose.Types.ObjectId.isValid(subject) ? [{ _id: subject }] : []),
          { name: { $regex: `^${subject.trim()}$`, $options: 'i' } }
        ]
      });
      if (foundSub && !student.subjects.some(s => s.toString() === foundSub._id.toString())) {
        student.subjects.push(foundSub._id);
      }
    }

    if (subjectPrices !== undefined && Array.isArray(subjectPrices) && subjectPrices.length > 0) {
      student.subjectPrices = subjectPrices.map(sp => ({
        subjectId: sp.subjectId,
        price: parseFloat(sp.price) || 0
      }));
      student.totalPrice = student.subjectPrices.reduce((sum, sp) => sum + sp.price, 0);
    } else if (totalPrice !== undefined) {
      student.totalPrice = Number(totalPrice);
    }

    if (hasSpecialNeeds !== undefined) student.hasSpecialNeeds = hasSpecialNeeds;
    if (specialNeed !== undefined) student.specialNeed = specialNeed;
    if (specialNeedsDetails !== undefined) student.specialNeedsDetails = specialNeedsDetails;
    if (paymentType) student.paymentType = paymentType;

    await student.save();

    // Sync registration payment record if admissionFee, monthlyClassFee, or paymentStatus changed
    const admFee = student.admissionFee || 0;
    const monFee = student.monthlyClassFee || 0;
    const totFee = student.totalFee || (admFee + monFee);

    if (totFee > 0 || admFee > 0 || monFee > 0) {
      let pType = 'Monthly Fee';
      if (admFee > 0 && monFee > 0) pType = 'Admission & Monthly Fee';
      else if (admFee > 0) pType = 'Admission Fee';

      const regDate = student.registrationDate || new Date();
      const monthStr = regDate.toLocaleString('en-US', { month: 'long' });

      try {
        const existingRegPay = await Payment.findOne({
          studentId: student._id,
          $or: [
            { paymentType: { $in: ['Admission & Monthly Fee', 'Admission Fee', 'Registration Fee'] } },
            { notes: { $regex: /Registration Fee/i } }
          ]
        });

        if (existingRegPay) {
          existingRegPay.totalAmount = totFee;
          existingRegPay.admissionFee = admFee;
          existingRegPay.monthlyFee = monFee;
          existingRegPay.paymentType = pType;
          existingRegPay.paymentStatus = student.paymentStatus || 'Paid';
          existingRegPay.month = monthStr;
          existingRegPay.subjects = student.subjects || [];
          existingRegPay.paymentDate = regDate;
          await existingRegPay.save();
        } else {
          await Payment.create({
            studentId: student._id,
            studentIdNumber: student.studentId,
            subjects: student.subjects || [],
            totalAmount: totFee,
            admissionFee: admFee,
            monthlyFee: monFee,
            paymentType: pType,
            paymentStatus: student.paymentStatus || 'Paid',
            month: monthStr,
            paymentMethod: 'Cash',
            paymentDate: regDate,
            createdBy: req.user?._id || null,
            notes: `Registration Fee (${pType}) recorded on student admission`
          });
        }
      } catch (paySyncErr) {
        console.error('Error syncing registration payment record:', paySyncErr);
      }
    }

    await student.populate('subjects', 'name price');

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    console.error('Error updating student:', error);
    console.error('Error stack:', error.stack);
    
    // Handle duplicate key errors (unique constraint violations)
    // Note: Email is no longer unique (allows family members to share email)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      let message = 'Duplicate entry';
      
      if (field === 'studentId') {
        message = 'This Student ID already exists. Please use a different Student ID.';
      } else {
        message = `${field} already exists`;
      }
      
      return res.status(400).json({
        success: false,
        message: message
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update student',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    await student.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Search students for autocomplete (public endpoint)
// @route   GET /api/students/search/autocomplete
// @access  Public
export const searchStudentsForAutocomplete = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 1) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const searchTerm = query.trim().toLowerCase();
    
    // Find students by ID or name (partial match)
    const students = await Student.find({
      $or: [
        { studentId: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .select('name studentId email')
    .limit(10)
    .sort({ studentId: 1 });

    // Format results similar to PaymentPage front-end logic
    const suggestions = students.map(student => ({
      _id: student._id,
      name: student.name,
      studentId: student.studentId,
      email: student.email,
      displayText: `${student.name} (ID: ${student.studentId})`
    }));

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Student portal sign-up: links to existing student registered by Admin via email, or creates account
// @route   POST /api/students/auth/signup
// @access  Public
export const studentAuthSignup = async (req, res) => {
  try {
    const { email, password, firstName, lastName, studentId } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const fullName = `${(firstName || '').trim()} ${(lastName || '').trim()}`.trim();

    // Check if an existing student was already registered by Admin with this email
    let student = await Student.findOne({ email: cleanEmail });

    // If not found by email and studentId was entered, check by studentId
    if (!student && studentId && studentId.trim()) {
      student = await Student.findOne({ studentId: studentId.trim() });
    }

    if (student) {
      // Existing student enrolled by Admin! Link their password and mark as registered
      student.password = password;
      student.isRegistered = true;
      if (fullName && (!student.name || student.name.toLowerCase() === 'student')) {
        student.name = fullName;
      }
      if (student.email !== cleanEmail) {
        student.email = cleanEmail;
      }
      await student.save();

      const populatedStudent = await Student.findById(student._id)
        .populate('subjects', 'name category price description duration image')
        .populate('subjectPrices.subjectId', 'name price');

      return res.status(200).json({
        success: true,
        message: 'Your portal account has been linked to your Wisdom Institute enrollment!',
        isLinkedToAdminRecord: true,
        token: generateStudentToken(student._id),
        data: populatedStudent
      });
    }

    // New student not yet in DB - create base student record
    const generatedStudentId = studentId && studentId.trim()
      ? studentId.trim()
      : `ST${Date.now().toString().slice(-4)}`;

    const newStudent = await Student.create({
      name: fullName || 'New Student',
      studentId: generatedStudentId,
      email: cleanEmail,
      password: password,
      birthday: new Date('2005-01-01'),
      gender: 'Other',
      mobile: '0700000000',
      isRegistered: true,
      subjects: [],
      subjectPrices: [],
      totalPrice: 0
    });

    const populatedNew = await Student.findById(newStudent._id)
      .populate('subjects', 'name category price description duration image')
      .populate('subjectPrices.subjectId', 'name price');

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Admin will assign your courses.',
      isLinkedToAdminRecord: false,
      token: generateStudentToken(newStudent._id),
      data: populatedNew
    });
  } catch (error) {
    console.error('Error in studentAuthSignup:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete registration'
    });
  }
};

// @desc    Student portal sign-in: signs in using email or Student ID
// @route   POST /api/students/auth/signin
// @access  Public
export const studentAuthSignin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Student ID/Email and password are required'
      });
    }

    const clean = identifier.trim();
    const isObjectId = mongoose.Types.ObjectId.isValid(clean);

    const query = {
      $or: [
        { email: clean.toLowerCase() },
        { username: clean.toLowerCase() },
        { studentId: { $regex: `^${clean}$`, $options: 'i' } },
        ...(isObjectId ? [{ _id: clean }] : [])
      ]
    };

    const student = await Student.findOne(query)
      .select('+password')
      .populate('subjects', 'name category price description duration image')
      .populate('subjectPrices.subjectId', 'name price');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `No student record found for "${clean}". Please verify that your email was registered by the Admin.`
      });
    }

    // If student already has a password, verify it
    if (student.password) {
      const isMatch = await student.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password. Please verify your credentials.'
        });
      }
    } else {
      // First time logging in after Admin created student! Save the chosen password
      student.password = password;
      student.isRegistered = true;
      await student.save();
    }

    const safeStudent = student.toObject();
    delete safeStudent.password;

    res.status(200).json({
      success: true,
      message: 'Welcome back!',
      token: generateStudentToken(student._id),
      data: safeStudent
    });
  } catch (error) {
    console.error('Error in studentAuthSignin:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

// @desc    Get complete student profile for Student Portal by ID, studentId, or email
// @route   GET /api/students/portal/:identifier
// @access  Public
export const getStudentPortalProfile = async (req, res) => {
  try {
    const { identifier } = req.params;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Identifier is required' });
    }

    const clean = identifier.trim();
    const isObjectId = mongoose.Types.ObjectId.isValid(clean);

    const query = {
      $or: [
        { studentId: { $regex: `^${clean}$`, $options: 'i' } },
        { email: clean.toLowerCase() },
        ...(isObjectId ? [{ _id: clean }] : [])
      ]
    };

    const student = await Student.findOne(query)
      .populate('subjects', 'name category price description duration image')
      .populate('subjectPrices.subjectId', 'name price');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Error in getStudentPortalProfile:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add a subject and class enrollment to an existing student
// @route   POST /api/students/:id/add-subject
// @access  Private
export const addSubjectToStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const {
      subject,
      teacherName,
      classType,
      classDay,
      classTime,
      classLocation,
      registrationDate,
      registrationStatus,
      paymentStatus,
      admissionFee,
      monthlyClassFee,
      totalFee
    } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Subject is required'
      });
    }

    const cleanSubject = subject.trim();
    const foundSubject = await Subject.findOne({
      $or: [
        ...(mongoose.Types.ObjectId.isValid(cleanSubject) ? [{ _id: cleanSubject }] : []),
        { name: { $regex: `^${cleanSubject}$`, $options: 'i' } }
      ]
    });

    const subjectName = foundSubject ? foundSubject.name : cleanSubject;
    const subjectId = foundSubject ? foundSubject._id : null;

    // Check if student is already enrolled in this subject
    const alreadyEnrolled = (student.subjects && student.subjects.some(
      (s) => s && s.toString() === (subjectId ? subjectId.toString() : '')
    )) || (student.enrolledSubjects && student.enrolledSubjects.some(
      (es) => es.subjectName && es.subjectName.toLowerCase() === subjectName.toLowerCase()
    )) || (student.subject && student.subject.toLowerCase().split(',').map(s => s.trim()).includes(subjectName.toLowerCase()));

    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: `Student is already enrolled in ${subjectName}`
      });
    }

    const admFee = parseFloat(admissionFee) || 0;
    const monFee = parseFloat(monthlyClassFee) || (foundSubject ? (foundSubject.price || 0) : 0);
    const totFee = totalFee !== undefined ? (parseFloat(totalFee) || 0) : Math.round((admFee + monFee) * 100) / 100;

    // Ensure enrolledSubjects array exists
    if (!student.enrolledSubjects) {
      student.enrolledSubjects = [];
    }

    // If enrolledSubjects is currently empty but student has an existing subject, backfill the existing one
    if (student.enrolledSubjects.length === 0 && student.subject) {
      const firstSub = await Subject.findOne({
        $or: [
          ...(student.subjects && student.subjects.length > 0 && student.subjects[0] ? [{ _id: student.subjects[0] }] : []),
          { name: { $regex: `^${student.subject.trim()}$`, $options: 'i' } }
        ]
      });
      student.enrolledSubjects.push({
        subjectId: firstSub ? firstSub._id : (student.subjects?.[0] || null),
        subjectName: student.subject,
        teacherName: student.teacherName || '',
        classType: student.classType || 'Physical',
        classDay: student.classDay || 'Saturday',
        classTime: student.classTime || '',
        classLocation: student.classLocation || '',
        admissionFee: student.admissionFee || 0,
        monthlyClassFee: student.monthlyClassFee || 0,
        totalFee: student.totalFee || 0,
        registrationDate: student.registrationDate || student.createdAt || new Date(),
        registrationStatus: student.registrationStatus || 'Active',
        paymentStatus: student.paymentStatus || 'Pending',
        enrolledAt: student.registrationDate || student.createdAt || new Date()
      });
    }

    // Add new subject to subjects array
    if (subjectId) {
      if (!student.subjects) student.subjects = [];
      student.subjects.push(subjectId);

      if (!student.subjectPrices) student.subjectPrices = [];
      student.subjectPrices.push({
        subjectId: subjectId,
        price: monFee
      });
    }

    // Add new enrollment record
    const regDateValue = registrationDate ? new Date(registrationDate) : new Date();
    student.enrolledSubjects.push({
      subjectId: subjectId,
      subjectName: subjectName,
      teacherName: (teacherName || (foundSubject?.conductedBy?.name || '')).trim(),
      classType: classType || 'Physical',
      classDay: classDay || 'Saturday',
      classTime: classTime || '',
      classLocation: (classLocation || '').trim(),
      admissionFee: admFee,
      monthlyClassFee: monFee,
      totalFee: totFee,
      registrationDate: isNaN(regDateValue.getTime()) ? new Date() : regDateValue,
      registrationStatus: registrationStatus || 'Active',
      paymentStatus: paymentStatus || 'Pending',
      enrolledAt: new Date()
    });

    // Update comma-separated subject string
    if (student.subject && student.subject.trim()) {
      student.subject = `${student.subject.trim()}, ${subjectName}`;
    } else {
      student.subject = subjectName;
    }

    // Update total fees
    student.totalFee = Math.round(((student.totalFee || 0) + totFee) * 100) / 100;
    student.totalPrice = student.totalFee;

    await student.save();

    // Auto-record Payment for this new subject enrollment
    let createdPayment = null;
    if (totFee > 0 || monFee > 0 || admFee > 0) {
      try {
        let pType = 'Monthly Fee';
        if (admFee > 0 && monFee > 0) {
          pType = 'Admission & Monthly Fee';
        } else if (admFee > 0) {
          pType = 'Admission Fee';
        } else {
          pType = 'Monthly Fee';
        }

        const effectivePaymentDate = isNaN(regDateValue.getTime()) ? new Date() : regDateValue;
        const monthName = effectivePaymentDate.toLocaleString('en-US', { month: 'long' });

        createdPayment = await Payment.create({
          studentId: student._id,
          studentIdNumber: student.studentId,
          subjects: subjectId ? [subjectId] : [],
          totalAmount: totFee,
          admissionFee: admFee,
          monthlyFee: monFee,
          paymentType: pType,
          paymentStatus: paymentStatus || 'Pending',
          month: monthName,
          paymentMethod: req.body.paymentMethod || 'Cash',
          paymentDate: effectivePaymentDate,
          createdBy: req.user?._id || null,
          notes: `Subject enrollment fee (${pType}) for ${subjectName}`
        });
        console.log(`[addSubjectToStudent] Recorded Payment ${createdPayment._id} for student ${student.studentId} (${subjectName})`);
      } catch (payErr) {
        console.error('Error creating payment record in addSubjectToStudent:', payErr);
      }
    }

    const populatedStudent = await Student.findById(student._id)
      .populate('subjects', 'name price')
      .populate('subjectPrices.subjectId', 'name price');

    res.status(200).json({
      success: true,
      message: `Subject "${subjectName}" added successfully to student!`,
      data: populatedStudent,
      payment: createdPayment
    });
  } catch (error) {
    console.error('Error adding subject to student:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add subject'
    });
  }
};

// @desc    Remove / Drop a subject from an existing student
// @route   POST /api/students/:id/remove-subject
// @access  Private
export const removeSubjectFromStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const { subject, subjectId, enrollmentId } = req.body;

    if (!subject && !subjectId && !enrollmentId) {
      return res.status(400).json({
        success: false,
        message: 'Subject name or ID is required to remove'
      });
    }

    // If enrolledSubjects is empty but student has an existing subject string, initialize enrolledSubjects first
    if ((!student.enrolledSubjects || student.enrolledSubjects.length === 0) && student.subject) {
      const firstSub = await Subject.findOne({
        $or: [
          ...(student.subjects && student.subjects.length > 0 && student.subjects[0] ? [{ _id: student.subjects[0] }] : []),
          { name: { $regex: `^${student.subject.trim()}$`, $options: 'i' } }
        ]
      });
      student.enrolledSubjects = [{
        subjectId: firstSub ? firstSub._id : (student.subjects?.[0] || null),
        subjectName: student.subject,
        teacherName: student.teacherName || '',
        classType: student.classType || 'Physical',
        classDay: student.classDay || 'Saturday',
        classTime: student.classTime || '',
        classLocation: student.classLocation || '',
        admissionFee: student.admissionFee || 0,
        monthlyClassFee: student.monthlyClassFee || 0,
        totalFee: student.totalFee || 0,
        registrationDate: student.registrationDate || student.createdAt || new Date(),
        registrationStatus: student.registrationStatus || 'Active',
        paymentStatus: student.paymentStatus || 'Pending',
        enrolledAt: student.registrationDate || student.createdAt || new Date()
      }];
    }

    let targetSubjectName = subject ? subject.trim() : '';
    let targetSubjectId = subjectId ? subjectId.toString() : '';

    // Remove from enrolledSubjects
    let removedRecord = null;
    if (student.enrolledSubjects && student.enrolledSubjects.length > 0) {
      const idx = student.enrolledSubjects.findIndex((es) => {
        if (enrollmentId && es._id && es._id.toString() === enrollmentId.toString()) return true;
        if (targetSubjectId && es.subjectId && es.subjectId.toString() === targetSubjectId) return true;
        if (targetSubjectName && es.subjectName && es.subjectName.toLowerCase() === targetSubjectName.toLowerCase()) return true;
        return false;
      });

      if (idx !== -1) {
        removedRecord = student.enrolledSubjects.splice(idx, 1)[0];
        if (!targetSubjectName && removedRecord.subjectName) {
          targetSubjectName = removedRecord.subjectName;
        }
        if (!targetSubjectId && removedRecord.subjectId) {
          targetSubjectId = removedRecord.subjectId.toString();
        }
      }
    }

    // Also look up Subject by name if targetSubjectId is still not found
    if (!targetSubjectId && targetSubjectName) {
      const foundSub = await Subject.findOne({ name: { $regex: `^${targetSubjectName}$`, $options: 'i' } });
      if (foundSub) {
        targetSubjectId = foundSub._id.toString();
      }
    }

    // Remove from student.subjects array
    if (student.subjects && student.subjects.length > 0) {
      student.subjects = student.subjects.filter((sub) => {
        const idStr = sub?._id ? sub._id.toString() : sub.toString();
        if (targetSubjectId && idStr === targetSubjectId) return false;
        return true;
      });
    }

    // Remove from student.subjectPrices array
    if (student.subjectPrices && student.subjectPrices.length > 0) {
      student.subjectPrices = student.subjectPrices.filter((sp) => {
        const spId = sp.subjectId?._id ? sp.subjectId._id.toString() : sp.subjectId?.toString();
        if (targetSubjectId && spId === targetSubjectId) return false;
        return true;
      });
    }

    // Update comma-separated student.subject string and sync primary class info
    if (student.enrolledSubjects && student.enrolledSubjects.length > 0) {
      student.subject = student.enrolledSubjects.map((es) => es.subjectName).filter(Boolean).join(', ');
      const primary = student.enrolledSubjects[0];
      student.teacherName = primary.teacherName || '';
      student.classType = primary.classType || 'Physical';
      student.classDay = primary.classDay || 'Saturday';
      student.classTime = primary.classTime || '';
      student.classLocation = primary.classLocation || '';
      student.monthlyClassFee = primary.monthlyClassFee || 0;
      
      const admissionFee = student.admissionFee || 0;
      const totalMonthly = student.enrolledSubjects.reduce((sum, es) => sum + (es.monthlyClassFee || 0), 0);
      student.totalFee = Math.round((admissionFee + totalMonthly) * 100) / 100;
      student.totalPrice = student.totalFee;
    } else {
      // If student has no subjects left
      student.subject = '';
      student.teacherName = '';
      student.classTime = '';
      student.classLocation = '';
      student.monthlyClassFee = 0;
      student.totalFee = student.admissionFee || 0;
      student.totalPrice = student.totalFee;
    }

    await student.save();

    // If there is an unpaid/pending payment for the dropped subject, clean it up
    try {
      if (targetSubjectId) {
        const pendingPayment = await Payment.findOne({
          studentId: student._id,
          paymentStatus: 'Pending',
          subjects: new mongoose.Types.ObjectId(targetSubjectId)
        });
        if (pendingPayment) {
          await pendingPayment.deleteOne();
          console.log(`[removeSubjectFromStudent] Removed pending payment ${pendingPayment._id} for dropped subject ${targetSubjectName}`);
        }
      }
    } catch (cleanPayErr) {
      console.error('Error cleaning up pending payment on remove subject:', cleanPayErr);
    }

    const populatedStudent = await Student.findById(student._id)
      .populate('subjects', 'name price')
      .populate('subjectPrices.subjectId', 'name price');

    res.status(200).json({
      success: true,
      message: `Subject "${targetSubjectName || 'Class'}" removed successfully from student!`,
      data: populatedStudent
    });
  } catch (error) {
    console.error('Error removing subject from student:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove subject'
    });
  }
};



