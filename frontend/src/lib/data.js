/**
 * Mock Data Layer for Wisdom Institute Student Portal (Vite Frontend)
 */

export const INITIAL_COURSES = [
  {
    id: '1',
    title: 'Mathematics – Grade 11',
    category: 'Mathematics',
    teacher: {
      name: 'Shalika Senanayake',
      title: 'Senior Mathematics Lecturer',
      avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
    },
    price: 3500, // Rs. 3,500 (Paid)
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    description: 'Comprehensive preparation for O/L Mathematics covering algebra, geometry, trigonometry, and statistics with past paper discussions.',
    duration: '48 Hours',
    lessons: [
      { id: 'm1', title: 'Quadratic Equations & Functions', duration: '45 mins', order: 1, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'm2', title: 'Geometric Progressions & Applications', duration: '55 mins', order: 2, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'm3', title: 'Circle Theorems & Geometric Proofs', duration: '60 mins', order: 3, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'm4', title: 'Trigonometric Ratios & Heights/Distances', duration: '50 mins', order: 4, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'm5', title: 'Probability, Sets & Data Representation', duration: '40 mins', order: 5, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    ],
    materials: [
      { id: 'mat1', title: 'Quadratic Equations Practice Worksheet.pdf', fileType: 'PDF', fileSize: '2.4 MB' },
      { id: 'mat2', title: 'Circle Theorems Quick Revision Guide.pdf', fileType: 'PDF', fileSize: '1.8 MB' },
      { id: 'mat3', title: 'Past Paper Questions (2020-2025).pdf', fileType: 'PDF', fileSize: '5.2 MB' },
    ],
    quiz: {
      id: 'qz-1',
      title: 'Algebra & Quadratic Equations Assessment',
      timeLimit: '15 mins',
      questions: [
        {
          id: 'q1',
          question: 'What are the roots of the quadratic equation x² - 5x + 6 = 0?',
          options: ['x = 2 and x = 3', 'x = -2 and x = -3', 'x = 1 and x = 6', 'x = -1 and x = -6'],
          correctIndex: 0,
          explanation: 'Factoring gives (x - 2)(x - 3) = 0, so x = 2 or x = 3.',
        },
        {
          id: 'q2',
          question: 'If the discriminant (b² - 4ac) of a quadratic equation is zero, the roots are:',
          options: ['Real and distinct', 'Real and equal', 'Complex/Imaginary', 'Undefined'],
          correctIndex: 1,
          explanation: 'When b² - 4ac = 0, the equation has one repeated real root.',
        },
      ],
    },
    assignment: {
      id: 'as-1',
      title: 'Trigonometry & Circle Theorem Problem Set',
      dueDate: '2026-10-15',
      totalMarks: 100,
      description: 'Solve problems 1-10 on page 84 of your workbook. Submit your handwritten solutions as a scanned PDF document.',
    },
  },
  {
    id: '2',
    title: 'English Communication',
    category: 'Languages',
    teacher: {
      name: 'Nadeesha Wickramasinghe',
      title: 'Head of English Department',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    price: 0, // Free Course
    image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80',
    description: 'Master spoken and written English, business correspondence, grammar fundamentals, and public speaking confidence.',
    duration: '32 Hours',
    lessons: [
      { id: 'e1', title: 'Tenses, Active & Passive Voice in Practice', duration: '35 mins', order: 1, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'e2', title: 'Professional Email Writing & Etiquette', duration: '40 mins', order: 2, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'e3', title: 'Pronunciation, Accent & Conversational Fluency', duration: '45 mins', order: 3, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'e4', title: 'Presentation Skills & Public Address', duration: '50 mins', order: 4, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    ],
    materials: [
      { id: 'mat4', title: 'Business Writing Cheat Sheet.pdf', fileType: 'PDF', fileSize: '1.2 MB' },
      { id: 'mat5', title: 'Essential 500 Vocabulary Words.pdf', fileType: 'PDF', fileSize: '3.1 MB' },
    ],
    quiz: {
      id: 'qz-2',
      title: 'Grammar and Sentence Structure Quiz',
      timeLimit: '10 mins',
      questions: [
        {
          id: 'qe1',
          question: 'Choose the correct sentence:',
          options: [
            'Neither of the students were present.',
            'Neither of the students was present.',
            'Neither of the student are present.',
            'Neither of the students have been present.',
          ],
          correctIndex: 1,
          explanation: '"Neither" is singular and takes a singular verb "was".',
        },
      ],
    },
    assignment: {
      id: 'as-2',
      title: 'Formal Business Letter Draft',
      dueDate: '2026-10-20',
      totalMarks: 100,
      description: 'Draft a formal complaint letter regarding damaged educational equipment received from a supplier.',
    },
  },
  {
    id: '3',
    title: 'ICT Basics & Computing',
    category: 'Technology',
    teacher: {
      name: 'Dulanja Gunawardana',
      title: 'Lead Software & Systems Instructor',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    price: 4500, // Rs. 4,500 (Paid)
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    description: 'Foundational computer science, number systems, computer architecture, networking protocols, and introductory programming logic.',
    duration: '40 Hours',
    lessons: [
      { id: 'i1', title: 'Computer Hardware Architecture & Von Neumann Model', duration: '50 mins', order: 1, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'i2', title: 'Binary, Octal, Hexadecimal & Two\'s Complement', duration: '60 mins', order: 2, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'i3', title: 'Boolean Logic Gates & Truth Tables', duration: '45 mins', order: 3, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'i4', title: 'Network Topologies & TCP/IP Layer Model', duration: '55 mins', order: 4, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'i5', title: 'Database Concepts & Basic SQL Syntax', duration: '50 mins', order: 5, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    ],
    materials: [
      { id: 'mat6', title: 'Number Systems Conversion Matrix.pdf', fileType: 'PDF', fileSize: '1.5 MB' },
      { id: 'mat7', title: 'SQL Practice Queries Handbook.pdf', fileType: 'PDF', fileSize: '2.8 MB' },
    ],
    quiz: {
      id: 'qz-3',
      title: 'Digital Logic and Number Systems Test',
      timeLimit: '20 mins',
      questions: [
        {
          id: 'qi1',
          question: 'What is the binary representation of the decimal number 25?',
          options: ['11001', '10101', '11010', '10011'],
          correctIndex: 0,
          explanation: '16 + 8 + 1 = 25, which corresponds to binary 11001.',
        },
      ],
    },
    assignment: {
      id: 'as-3',
      title: 'Database Schema Design & SQL Creation',
      dueDate: '2026-10-30',
      totalMarks: 100,
      description: 'Design a relational schema with 3 tables (Students, Courses, Enrollments) and submit your DDL scripts.',
    },
  },
  {
    id: '4',
    title: 'Physics Fundamentals',
    category: 'Science',
    teacher: {
      name: 'Dr. Anuradha Jayasuriya',
      title: 'PhD in Applied Physics',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    price: 7500, // Rs. 7,500 (Paid)
    image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&auto=format&fit=crop&q=80',
    description: 'Mechanics, Newton\'s Laws, Thermal Physics, Wave Optics, and Electromagnetism with practical experiment demonstrations.',
    duration: '60 Hours',
    lessons: [
      { id: 'p1', title: 'Kinematics in 1D and 2D Dimensions', duration: '55 mins', order: 1, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'p2', title: 'Circular Motion, Gravitation & Orbits', duration: '50 mins', order: 2, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'p3', title: 'Thermodynamics & Heat Transfer Principles', duration: '60 mins', order: 3, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    ],
    materials: [
      { id: 'mat8', title: 'Physics Formula Sheet (All Units).pdf', fileType: 'PDF', fileSize: '2.1 MB' },
    ],
    quiz: {
      id: 'qz-4',
      title: 'Mechanics & Momentum Rapid Quiz',
      timeLimit: '15 mins',
      questions: [
        {
          id: 'qp1',
          question: 'The rate of change of momentum is proportional to:',
          options: ['Applied Force', 'Velocity', 'Acceleration', 'Mass'],
          correctIndex: 0,
          explanation: 'Newton\'s second law states F = dp/dt.',
        },
      ],
    },
    assignment: {
      id: 'as-4',
      title: 'Projectile Motion Lab Report',
      dueDate: '2026-11-10',
      totalMarks: 100,
      description: 'Document your projectile trajectory calculations and compare theoretical vs experimental range values.',
    },
  },
  {
    id: '5',
    title: 'Web Development Basics',
    category: 'Technology',
    teacher: {
      name: 'Kasun Rathnayake',
      title: 'Full-Stack Software Engineer',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    },
    price: 0, // Free Course
    image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=600&auto=format&fit=crop&q=80',
    description: 'Learn modern HTML5 semantic markup, CSS3 Flexbox & Grid layouts, responsive UI design, and JavaScript DOM manipulation.',
    duration: '24 Hours',
    lessons: [
      { id: 'w1', title: 'Semantic HTML5 & Accessibility Standards', duration: '40 mins', order: 1, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'w2', title: 'CSS3 Flexbox, Grid & Responsive Media Queries', duration: '50 mins', order: 2, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'w3', title: 'JavaScript ES6+ Fundamentals & Event Handlers', duration: '55 mins', order: 3, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    ],
    materials: [
      { id: 'mat9', title: 'Modern CSS Layouts Cheatsheet.pdf', fileType: 'PDF', fileSize: '1.9 MB' },
    ],
    quiz: {
      id: 'qz-5',
      title: 'HTML & CSS Fundamentals Test',
      timeLimit: '10 mins',
      questions: [
        {
          id: 'qw1',
          question: 'Which CSS property is used to create a flex container?',
          options: ['display: flex', 'flex-direction: row', 'align-items: center', 'position: relative'],
          correctIndex: 0,
          explanation: 'display: flex defines an element as a flex container.',
        },
      ],
    },
    assignment: {
      id: 'as-5',
      title: 'Responsive Portfolio Page Build',
      dueDate: '2026-11-20',
      totalMarks: 100,
      description: 'Build a single-page responsive personal portfolio using clean semantic HTML and CSS Grid.',
    },
  },
];

export const INITIAL_CLASSES = [
  {
    id: 'cls-101',
    courseId: '1',
    courseTitle: 'Mathematics – Grade 11',
    title: 'Circle Theorems & Past Paper Problem Solving',
    instructor: 'Shalika Senanayake',
    date: 'Mon, Sep 22',
    time: '4:00 PM - 6:00 PM',
    duration: '2 Hours',
  },
  {
    id: 'cls-102',
    courseId: '2',
    courseTitle: 'English Communication',
    title: 'Interactive Spoken English & Pronunciation Workshop',
    instructor: 'Nadeesha Wickramasinghe',
    date: 'Wed, Sep 24',
    time: '5:30 PM - 7:00 PM',
    duration: '1.5 Hours',
  },
  {
    id: 'cls-103',
    courseId: '3',
    courseTitle: 'ICT Basics & Computing',
    title: 'Live Coding: Logic Gates & Binary Arithmetic',
    instructor: 'Dulanja Gunawardana',
    date: 'Fri, Sep 26',
    time: '6:00 PM - 8:00 PM',
    duration: '2 Hours',
  },
  {
    id: 'cls-104',
    courseId: '4',
    courseTitle: 'Physics Fundamentals',
    title: 'Kinematics Numerical Problems Seminar',
    instructor: 'Dr. Anuradha Jayasuriya',
    date: 'Sat, Sep 27',
    time: '9:00 AM - 11:30 AM',
    duration: '2.5 Hours',
  },
];

export const INITIAL_RESULTS = [
  {
    id: 'res-1',
    courseTitle: 'English Communication',
    title: 'Grammar and Sentence Structure Quiz',
    score: 95,
    maxScore: 100,
    mark: 95,
    grade: 'Distinction',
    date: '2026-09-12',
    type: 'Quiz',
  },
  {
    id: 'res-2',
    courseTitle: 'ICT Basics & Computing',
    title: 'Digital Logic and Number Systems Test',
    score: 84,
    maxScore: 100,
    mark: 84,
    grade: 'Distinction',
    date: '2026-09-15',
    type: 'Mid-term',
  },
  {
    id: 'res-3',
    courseTitle: 'English Communication',
    title: 'Formal Business Letter Draft',
    score: 88,
    maxScore: 100,
    mark: 88,
    grade: 'Distinction',
    date: '2026-09-18',
    type: 'Assignment',
  },
];

export const INITIAL_PAYMENTS = [
  {
    id: 'INV-2026-8821',
    courseTitle: 'ICT Basics & Computing',
    amount: 4500,
    method: 'Card •••• 4242',
    date: '2026-09-01',
    status: 'Paid',
  },
  {
    id: 'INV-2026-7734',
    courseTitle: 'English Communication',
    amount: 0,
    method: 'Free Scholarship',
    date: '2026-09-02',
    status: 'Paid',
  },
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'New Class Material Uploaded',
    message: 'Teacher Shalika uploaded "Past Paper Questions (2020-2025).pdf" for Mathematics Grade 11.',
    timestamp: '2 hours ago',
    date: 'Today',
    read: false,
    type: 'class',
  },
  {
    id: 'notif-2',
    title: 'Live Class Tomorrow',
    message: 'Reminder: English Communication live lecture starts tomorrow at 5:30 PM.',
    timestamp: '5 hours ago',
    date: 'Today',
    read: false,
    type: 'class',
  },
  {
    id: 'notif-3',
    title: 'Assignment Graded',
    message: 'Your assignment "Formal Business Letter Draft" has been graded: 88/100 (Distinction).',
    timestamp: '1 day ago',
    date: 'Yesterday',
    read: true,
    type: 'result',
  },
  {
    id: 'notif-4',
    title: 'Payment Receipt Available',
    message: 'Payment of Rs. 4,500 for ICT Basics & Computing was processed successfully.',
    timestamp: '3 days ago',
    date: 'Sep 18',
    read: true,
    type: 'payment',
  },
];
