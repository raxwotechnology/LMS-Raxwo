import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Subject from '../models/Subject.js';
import Class from '../models/Class.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to safely delete local upload files
const deleteLocalFile = (filePath) => {
  try {
    if (!filePath || !filePath.startsWith('/uploads/')) return;
    const localPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  } catch (err) {
    console.error('Error deleting local file:', err.message);
  }
};

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Public
export const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate('conductedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Public
export const getSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('conductedBy', 'name');
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: subject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create subject
// @route   POST /api/subjects
// @access  Private
export const createSubject = async (req, res) => {
  try {
    const { name, conductedBy, price, description } = req.body;

    // Validate input
    if (!name || !conductedBy || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, conductedBy, description)'
      });
    }

    // Handle local image upload or URL (Image is completely optional)
    let image = '';
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    } else if (req.body.image) {
      image = req.body.image;
    }

    // Check if subject already exists
    const subjectExists = await Subject.findOne({ name });
    if (subjectExists) {
      // If a file was uploaded but subject already exists, cleanup the uploaded file
      if (req.file) {
        deleteLocalFile(`/uploads/${req.file.filename}`);
      }
      return res.status(400).json({
        success: false,
        message: 'Subject already exists with this name'
      });
    }

    // Create subject
    const subject = await Subject.create({
      name,
      conductedBy,
      price: price || undefined,
      image,
      description
    });

    // Populate the created subject
    await subject.populate('conductedBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: subject
    });
  } catch (error) {
    // Cleanup uploaded file on error
    if (req.file) {
      deleteLocalFile(`/uploads/${req.file.filename}`);
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private
export const updateSubject = async (req, res) => {
  try {
    const { name, conductedBy, price, description, status } = req.body;

    let subject = await Subject.findById(req.params.id);

    if (!subject) {
      if (req.file) {
        deleteLocalFile(`/uploads/${req.file.filename}`);
      }
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Update fields
    if (name) subject.name = name;
    if (conductedBy) subject.conductedBy = conductedBy;
    if (price !== undefined) subject.price = price;
    
    // Handle image update
    const oldImage = subject.image;
    
    if (req.file) {
      // New file uploaded
      subject.image = `/uploads/${req.file.filename}`;
      // Remove old local file if different
      if (oldImage && oldImage.startsWith('/uploads/')) {
        deleteLocalFile(oldImage);
      }
    } else if (req.body.image !== undefined) {
      if (oldImage && oldImage.startsWith('/uploads/') && oldImage !== req.body.image) {
        deleteLocalFile(oldImage);
      }
      subject.image = req.body.image;
    }
    
    if (description) subject.description = description;
    if (status) subject.status = status;

    await subject.save();

    // Populate before sending response
    await subject.populate('conductedBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: subject
    });
  } catch (error) {
    if (req.file) {
      deleteLocalFile(`/uploads/${req.file.filename}`);
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private
export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Delete the local image file if it exists
    if (subject.image && subject.image.startsWith('/uploads/')) {
      deleteLocalFile(subject.image);
    }

    // Delete the subject from database
    await subject.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get subjects for a specific teacher
// @route   GET /api/subjects/teacher/:teacherId
// @access  Private
export const getSubjectsByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    const subjects = await Subject.find({ conductedBy: teacherId })
      .populate('conductedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Start a class (subject) - saves to Class table
// @route   POST /api/subjects/:subjectId/start-class
// @access  Private
export const startClass = async (req, res) => {
  try {
    const { id: subjectId } = req.params;
    const currentUserId = req.user._id;
    const userType = req.userType || 'employee';

    const subject = await Subject.findById(subjectId).populate('conductedBy', 'name email');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Admins can start any class, otherwise check if it's their class
    const isAdmin = userType === 'admin';
    const teacherId = subject.conductedBy?._id || subject.conductedBy;
    const isAssignedTeacher = teacherId?.toString() === currentUserId.toString();

    if (!isAdmin && !isAssignedTeacher) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to start this class. Only the assigned teacher can start this class.'
      });
    }

    // Extract date, time, startTime, endTime, classType from request
    const { date, time, startTime, endTime, classType } = req.body;
    
    const resolvedStartTime = (startTime || (time ? time.split('-')[0]?.trim() : '') || '').trim();
    const resolvedEndTime = (endTime || (time && time.includes('-') ? time.split('-')[1]?.trim() : '') || '').trim();
    const resolvedTime = (time || (resolvedStartTime && resolvedEndTime ? `${resolvedStartTime} - ${resolvedEndTime}` : resolvedStartTime || '')).trim();

    if (!date || (!resolvedTime && !resolvedStartTime)) {
      return res.status(400).json({
        success: false,
        message: 'Date and class start/end times are required'
      });
    }

    // Create class in database - default to 'scheduled' so admin can start it manually
    const initialStatus = req.body.status || 'scheduled';

    const newClass = await Class.create({
      subjectId: subjectId,
      teacherId: teacherId,
      date: date,
      time: resolvedTime,
      startTime: resolvedStartTime || resolvedTime,
      endTime: resolvedEndTime,
      classType: classType === 'Online' ? 'Online' : 'Physical',
      status: initialStatus
    });

    // Populate the created class
    await newClass.populate([
      { path: 'subjectId', select: 'name description image' },
      { path: 'teacherId', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: initialStatus === 'ongoing'
        ? `Class "${subject.name}" started successfully and is now live`
        : `Class "${subject.name}" scheduled successfully`,
      data: newClass
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
