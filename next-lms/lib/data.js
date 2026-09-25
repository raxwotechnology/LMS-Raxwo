/**
 * Mock Data Layer for Wisdom Institute Student Portal
 *
 * TODO: Replace with real API calls to backend:
 * - GET /api/courses
 * - GET /api/courses/:id
 * - GET /api/classes
 * - GET /api/marks/student/:studentId
 * - GET /api/payments/student/:studentId
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
      name: 'Kamala Perera',
      title: 'Head of English Dept.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    price: null, // Free
    image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80',
    description: 'Master spoken English, corporate communication, email etiquette, and public speaking confidence for students and young professionals.',
    duration: '32 Hours',
    lessons: [
      { id: 'e1', title: 'Phonetics, Pronunciation & Accent Training', duration: '35 mins', order: 1, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'e2', title: 'Constructing Professional Emails & Memos', duration: '40 mins', order: 2, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'e3', title: 'Conversational Fluency in Academic Contexts', duration: '45 mins', order: 3, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'e4', title: 'Public Speaking & Presentation Skills', duration: '50 mins', order: 4, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    ],
    materials: [
      { id: 'mat4', title: 'Business English Vocabulary Handbook.pdf', fileType: 'PDF', fileSize: '3.1 MB' },
      { id: 'mat5', title: 'Email Templates for Academic Queries.docx', fileType: 'DOCX', fileSize: '850 KB' },
    ],
    quiz: {
      id: 'qz-2',
      title: 'Grammar, Tenses & Formal Register Quiz',
      timeLimit: '10 mins',
      questions: [
        {
          id: 'q3',
          question: 'Choose the sentence with correct subject-verb agreement:',
          options: [
            'Each of the students have completed their assignment.',
            'Each of the students has completed their assignment.',
            'Each of the students were completing their assignment.',
            'Each of the students are completing their assignment.',
          ],
          correctIndex: 1,
          explanation: '"Each" is singular and takes the singular verb "has".',
        },
        {
          id: 'q4',
          question: 'Which word is an antonym of "Meticulous"?',
          options: ['Diligent', 'Careless', 'Thorough', 'Precise'],
          correctIndex: 1,
          explanation: '"Careless" is the direct antonym of "Meticulous" (very careful and precise).',
        },
      ],
    },
    assignment: {
      id: 'as-2',
      title: 'Formal Academic Inquiry Letter Writing',
      dueDate: '2026-10-10',
      totalMarks: 50,
      description: 'Draft a 300-word formal letter requesting a research paper extension due to technical constraints. Upload in PDF or DOCX format.',
    },
  },
  {
    id: '3',
    title: 'ICT Basics',
    category: 'Technology',
    teacher: {
      name: 'Nuwan Jayawardena',
      title: 'Software Architect & Lecturer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    price: 4500, // Rs. 4,500 (Paid)
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    description: 'Foundational computer science principles, hardware, binary logic, networking basics, cybersecurity awareness, and MS Office tools.',
    duration: '40 Hours',
    lessons: [
      { id: 'i1', title: 'Computer Architecture & System Buses', duration: '40 mins', order: 1, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'i2', title: 'Binary, Hexadecimal & Number Conversions', duration: '50 mins', order: 2, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'i3', title: 'Logic Gates & Boolean Algebra Simplification', duration: '60 mins', order: 3, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'i4', title: 'Networking Fundamentals: IP Addressing & Subnets', duration: '55 mins', order: 4, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    ],
    materials: [
      { id: 'mat6', title: 'Number Systems Conversion Cheat Sheet.pdf', fileType: 'PDF', fileSize: '1.2 MB' },
      { id: 'mat7', title: 'Logic Gates Simulation Exercises.pdf', fileType: 'PDF', fileSize: '2.0 MB' },
    ],
    quiz: {
      id: 'qz-3',
      title: 'Hardware & Number Systems Quiz',
      timeLimit: '15 mins',
      questions: [
        {
          id: 'q5',
          question: 'What is the binary equivalent of decimal 13?',
          options: ['1101', '1011', '1110', '1001'],
          correctIndex: 0,
          explanation: '13 in binary is 8 + 4 + 1 = 1101₂.',
        },
        {
          id: 'q6',
          question: 'Which logic gate outputs 0 only when both inputs are 1?',
          options: ['NOR', 'NAND', 'XOR', 'AND'],
          correctIndex: 1,
          explanation: 'NAND is the inverse of AND: outputs 0 only when A=1 and B=1.',
        },
      ],
    },
    assignment: {
      id: 'as-3',
      title: 'Boolean Circuit Design & Truth Table Analysis',
      dueDate: '2026-10-20',
      totalMarks: 100,
      description: 'Design a digital circuit that implements a 3-input majority voter logic. Include truth table, Karnaugh map, and circuit diagram.',
    },
  },
  {
    id: '4',
    title: 'Physics Fundamentals',
    category: 'Science',
    teacher: {
      name: 'Dr. Rohan Wickramasinghe',
      title: 'Senior Physics Fellow',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    price: 7500, // Rs. 7,500 (Paid)
    image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&auto=format&fit=crop&q=80',
    description: 'Deep dive into classical mechanics, Newton’s laws of motion, wave optics, electricity, and thermodynamics for advanced students.',
    duration: '56 Hours',
    lessons: [
      { id: 'p1', title: 'Kinematics in One & Two Dimensions', duration: '50 mins', order: 1, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'p2', title: 'Work, Energy, Power & Momentum Conservation', duration: '60 mins', order: 2, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'p3', title: 'Rotational Dynamics & Moment of Inertia', duration: '65 mins', order: 3, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'p4', title: 'Wave Optics: Interference & Diffraction', duration: '55 mins', order: 4, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    ],
    materials: [
      { id: 'mat8', title: 'Mechanics Formula Summary & Derivations.pdf', fileType: 'PDF', fileSize: '4.5 MB' },
      { id: 'mat9', title: 'Wave Optics Laboratory Guide.pdf', fileType: 'PDF', fileSize: '3.2 MB' },
    ],
    quiz: {
      id: 'qz-4',
      title: 'Mechanics & Energy Conservation Checkpoint',
      timeLimit: '20 mins',
      questions: [
        {
          id: 'q7',
          question: 'A ball is thrown straight up. At the highest point of its trajectory, what is its acceleration?',
          options: ['0 m/s²', '9.8 m/s² downward', '9.8 m/s² upward', 'Dependent on initial velocity'],
          correctIndex: 1,
          explanation: 'Gravity is always acting on the ball, causing a constant downward acceleration of 9.8 m/s².',
        },
        {
          id: 'q8',
          question: 'In an elastic collision between two isolated bodies, which quantities are conserved?',
          options: ['Kinetic energy only', 'Momentum only', 'Both momentum and kinetic energy', 'Total potential energy only'],
          correctIndex: 2,
          explanation: 'By definition, elastic collisions conserve both linear momentum and total kinetic energy.',
        },
      ],
    },
    assignment: {
      id: 'as-4',
      title: 'Projectile Motion Lab Simulation Report',
      dueDate: '2026-10-25',
      totalMarks: 100,
      description: 'Run the projectile motion simulator at 3 different launch angles (30°, 45°, 60°). Graph trajectory ranges and compare with theoretical predictions.',
    },
  },
  {
    id: '5',
    title: 'Web Development Basics',
    category: 'Technology',
    teacher: {
      name: 'Hasini Fernando',
      title: 'Full Stack Engineer & Mentor',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    price: null, // Free
    image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=600&auto=format&fit=crop&q=80',
    description: 'Learn modern HTML5 semantics, CSS3 flexbox/grid, JavaScript ES6 basics, and build responsive mobile-first websites from scratch.',
    duration: '36 Hours',
    lessons: [
      { id: 'w1', title: 'HTML5 Semantic Elements & Structure', duration: '30 mins', order: 1, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'w2', title: 'CSS3 Flexbox, Grid & Modern Layouts', duration: '45 mins', order: 2, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'w3', title: 'JavaScript DOM Manipulation & Event Handling', duration: '55 mins', order: 3, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'w4', title: 'Building a Responsive Portfolio Website', duration: '60 mins', order: 4, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    ],
    materials: [
      { id: 'mat10', title: 'HTML & CSS Quick Reference Guide.pdf', fileType: 'PDF', fileSize: '2.1 MB' },
      { id: 'mat11', title: 'Starter Project Code Template.zip', fileType: 'ZIP', fileSize: '4.8 MB' },
    ],
    quiz: {
      id: 'qz-5',
      title: 'Frontend Fundamentals Quiz',
      timeLimit: '12 mins',
      questions: [
        {
          id: 'q9',
          question: 'Which HTML5 element represents self-contained content, like a blog post or news story?',
          options: ['<section>', '<article>', '<aside>', '<div>'],
          correctIndex: 1,
          explanation: '<article> is specified for independent, self-contained syndicateable content.',
        },
        {
          id: 'q10',
          question: 'In CSS Flexbox, which property aligns items along the cross axis?',
          options: ['justify-content', 'align-items', 'flex-direction', 'align-content'],
          correctIndex: 1,
          explanation: 'justify-content aligns along the main axis; align-items aligns along the cross axis.',
        },
      ],
    },
    assignment: {
      id: 'as-5',
      title: 'Responsive Landing Page Project',
      dueDate: '2026-10-30',
      totalMarks: 100,
      description: 'Build a mobile-first responsive landing page for a fictional business using HTML5, CSS Flexbox/Grid, and minimal vanilla JavaScript.',
    },
  },
];

export const INITIAL_CLASSES = [
  {
    id: 'cls-1',
    courseId: '2',
    courseTitle: 'English Communication',
    title: 'Live Conversational Practice & Role-Playing',
    teacher: 'Kamala Perera',
    date: 'Today',
    time: '05:30 PM - 07:00 PM',
    status: 'Live Now',
    meetingUrl: 'https://zoom.us/j/wisdom-live-class-1',
  },
  {
    id: 'cls-2',
    courseId: '3',
    courseTitle: 'ICT Basics',
    title: 'Logic Gates & Binary Arithmetic Workshop',
    teacher: 'Nuwan Jayawardena',
    date: 'Tomorrow',
    time: '04:00 PM - 06:00 PM',
    status: 'Upcoming',
    meetingUrl: 'https://zoom.us/j/wisdom-live-class-2',
  },
  {
    id: 'cls-3',
    courseId: '1',
    courseTitle: 'Mathematics – Grade 11',
    title: 'Trigonometry & Circle Theorems Discussion',
    teacher: 'Shalika Senanayake',
    date: 'Thursday, Sep 24',
    time: '06:00 PM - 08:00 PM',
    status: 'Upcoming',
    meetingUrl: 'https://zoom.us/j/wisdom-live-class-3',
  },
  {
    id: 'cls-4',
    courseId: '5',
    courseTitle: 'Web Development Basics',
    title: 'Interactive DOM & JavaScript Events Q&A',
    teacher: 'Hasini Fernando',
    date: 'Friday, Sep 25',
    time: '07:00 PM - 08:30 PM',
    status: 'Upcoming',
    meetingUrl: 'https://zoom.us/j/wisdom-live-class-4',
  },
];

export const INITIAL_RESULTS = [
  {
    id: 'res-1',
    courseTitle: 'English Communication',
    item: 'Grammar & Tenses Quiz 1',
    mark: 92,
    date: '2026-09-12',
  },
  {
    id: 'res-2',
    courseTitle: 'ICT Basics',
    item: 'Number Systems & Binary Test',
    mark: 85,
    date: '2026-09-15',
  },
  {
    id: 'res-3',
    courseTitle: 'English Communication',
    item: 'Formal Email Writing Assignment',
    mark: 70,
    date: '2026-09-18',
  },
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Course Enrolled Successfully',
    message: 'You have been enrolled in English Communication. Start your first lesson now!',
    date: '2 hours ago',
    read: false,
    type: 'enroll',
  },
  {
    id: 'notif-2',
    title: 'Live Class Starting Soon',
    message: 'English Communication live practice session starts at 05:30 PM today.',
    date: '4 hours ago',
    read: false,
    type: 'class',
  },
  {
    id: 'notif-3',
    title: 'Quiz Result Released',
    message: 'Your score for Number Systems & Binary Test in ICT Basics is 85%. Great job!',
    date: '2 days ago',
    read: true,
    type: 'quiz',
  },
];

export const INITIAL_PAYMENTS = [
  {
    id: 'INV-1001',
    courseTitle: 'ICT Basics',
    amount: 4500,
    maskedCard: '•••• 4242',
    date: '2026-09-10',
    status: 'Paid',
  },
];
