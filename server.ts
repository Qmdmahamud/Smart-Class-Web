import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  User,
  Classroom,
  StudentProfile,
  Attendance,
  Assignment,
  Submission,
  Message,
  Reminder,
  ServerMetrics,
  ScheduleItem
} from "./src/types.js";

// Initialize express app
const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database Store
let users: User[] = [];
let classrooms: Classroom[] = [];
let studentProfiles: StudentProfile[] = [];
let attendances: Attendance[] = [];
let assignments: Assignment[] = [];
let submissions: Submission[] = [];
let messages: Message[] = [];
let reminders: Reminder[] = [];

// Track server start for uptime metrics
const serverStartTime = Date.now();

// Idempotent Seeding function (matches Django seed_classroom.py)
function seedDatabase() {
  // Clear existing
  users = [];
  classrooms = [];
  studentProfiles = [];
  attendances = [];
  assignments = [];
  submissions = [];
  messages = [];
  reminders = [];

  // 1. Seed Users
  const seedUsers: User[] = [
    { id: "u-admin", email: "admin@classroom.com", fullName: "Director Sarah Jenkins", role: "admin" },
    { id: "u-teacher1", email: "clara.oswald@classroom.com", fullName: "Dr. Clara Oswald", role: "teacher" },
    { id: "u-teacher2", email: "albus.d@classroom.com", fullName: "Prof. Albus Dumbledore", role: "teacher" },
    { id: "u-student1", email: "peter.parker@classroom.com", fullName: "Peter Parker", role: "student" },
    { id: "u-student2", email: "hermione.g@classroom.com", fullName: "Hermione Granger", role: "student" },
    { id: "u-student3", email: "ron.weasley@classroom.com", fullName: "Ron Weasley", role: "student" },
    { id: "u-parent1", email: "may.parker@classroom.com", fullName: "May Parker", role: "parent" },
    { id: "u-parent2", email: "jean.granger@classroom.com", fullName: "Jean Granger", role: "parent" },
    { id: "u-parent3", email: "arthur.weasley@classroom.com", fullName: "Arthur Weasley", role: "parent" }
  ];
  users.push(...seedUsers);

  // 2. Seed Classrooms
  const seedClassrooms: Classroom[] = [
    {
      id: "c-astronomy",
      name: "Quantum Physics & Astronomy",
      description: "An advanced look at gravitational anomalies, quantum entanglement, and stellar spectroscopy.",
      teacherId: "u-teacher1",
      teacherName: "Dr. Clara Oswald",
      schedule: [
        { day: "Monday", startTime: "09:00", endTime: "10:30", room: "Observatory Alpha", platform: "In-Person", link: "" },
        { day: "Wednesday", startTime: "09:00", endTime: "10:30", room: "Observatory Alpha", platform: "Zoom", link: "https://zoom.us/j/quantum-physics-class" }
      ]
    },
    {
      id: "c-transfiguration",
      name: "Advanced Transfiguration Theory",
      description: "Deconstructing molecular frameworks and altering molecular lattices at a subatomic scale.",
      teacherId: "u-teacher2",
      teacherName: "Prof. Albus Dumbledore",
      schedule: [
        { day: "Tuesday", startTime: "11:00", endTime: "12:30", room: "Lecture Hall B", platform: "In-Person", link: "" },
        { day: "Thursday", startTime: "11:00", endTime: "12:30", room: "Lecture Hall B", platform: "Google Meet", link: "https://meet.google.com/transfig-advanced" }
      ]
    }
  ];
  classrooms.push(...seedClassrooms);

  // 3. Seed Student Profiles
  const seedProfiles: StudentProfile[] = [
    {
      id: "sp-peter",
      userId: "u-student1",
      fullName: "Peter Parker",
      email: "peter.parker@classroom.com",
      parentEmail: "may.parker@classroom.com",
      classes: ["c-astronomy", "c-transfiguration"],
      engagementScore: 88,
      gradesAvg: 91,
      attendanceAvg: 94
    },
    {
      id: "sp-hermione",
      userId: "u-student2",
      fullName: "Hermione Granger",
      email: "hermione.g@classroom.com",
      parentEmail: "jean.granger@classroom.com",
      classes: ["c-astronomy", "c-transfiguration"],
      engagementScore: 99,
      gradesAvg: 100,
      attendanceAvg: 100
    },
    {
      id: "sp-ron",
      userId: "u-student3",
      fullName: "Ron Weasley",
      email: "ron.weasley@classroom.com",
      parentEmail: "arthur.weasley@classroom.com",
      classes: ["c-transfiguration"],
      engagementScore: 52,
      gradesAvg: 73,
      attendanceAvg: 85
    }
  ];
  studentProfiles.push(...seedProfiles);

  // 4. Seed Attendance Records
  const seedAttendance: Attendance[] = [
    { id: "att-1", studentId: "sp-peter", studentName: "Peter Parker", classroomId: "c-astronomy", date: "2026-06-29", status: "Present" },
    { id: "att-2", studentId: "sp-hermione", studentName: "Hermione Granger", classroomId: "c-astronomy", date: "2026-06-29", status: "Present" },
    { id: "att-3", studentId: "sp-peter", studentName: "Peter Parker", classroomId: "c-transfiguration", date: "2026-06-30", status: "Late" },
    { id: "att-4", studentId: "sp-hermione", studentName: "Hermione Granger", classroomId: "c-transfiguration", date: "2026-06-30", status: "Present" },
    { id: "att-5", studentId: "sp-ron", studentName: "Ron Weasley", classroomId: "c-transfiguration", date: "2026-06-30", status: "Absent" }
  ];
  attendances.push(...seedAttendance);

  // 5. Seed Assignments
  const seedAssignments: Assignment[] = [
    {
      id: "as-quantum-lab",
      classroomId: "c-astronomy",
      classroomName: "Quantum Physics & Astronomy",
      title: "Lab Report: Einstein-Podolsky-Rosen Paradox",
      description: "Analyze photon spin correlation data and calculate violation of Bell's inequalities.",
      dueDate: "2026-07-05T23:59:00Z",
      maxPoints: 100
    },
    {
      id: "as-transfig-essay",
      classroomId: "c-transfiguration",
      classroomName: "Advanced Transfiguration Theory",
      title: "Critique of Gamp's Law of Elemental Transfiguration",
      description: "Discuss the 5 principal exceptions to Gamp's Law with modern scientific equivalents.",
      dueDate: "2026-07-08T23:59:00Z",
      maxPoints: 50
    }
  ];
  assignments.push(...seedAssignments);

  // 6. Seed Submissions
  const seedSubmissions: Submission[] = [
    {
      id: "sub-peter-1",
      assignmentId: "as-quantum-lab",
      assignmentTitle: "Lab Report: Einstein-Podolsky-Rosen Paradox",
      studentId: "sp-peter",
      studentName: "Peter Parker",
      submissionDate: "2026-07-01T04:20:00Z",
      contentText: "By utilizing high-coherence crystal polarization detectors, we plotted the Bell state inequalities and proved quantum mechanics triumphs over local hidden variable theories by 14 standard deviations. (P.S. Please grade quickly Dr. Oswald, I have a spider emergency!)",
      status: "Submitted",
      pointsScored: undefined,
      teacherFeedback: undefined
    },
    {
      id: "sub-hermione-1",
      assignmentId: "as-quantum-lab",
      assignmentTitle: "Lab Report: Einstein-Podolsky-Rosen Paradox",
      studentId: "sp-hermione",
      studentName: "Hermione Granger",
      submissionDate: "2026-06-30T10:00:00Z",
      contentText: "An exhaustive 14-page inquiry into Einstein-Podolsky-Rosen non-locality. Using modern quantum electrodynamics models, we prove that local realism cannot hold under any reasonable physical axioms, accompanied by double-slit interference matrix transformations.",
      status: "Graded",
      pointsScored: 100,
      teacherFeedback: "Flawless mathematical formulation. Easily doctoral-level work, Hermione!"
    },
    {
      id: "sub-hermione-2",
      assignmentId: "as-transfig-essay",
      assignmentTitle: "Critique of Gamp's Law of Elemental Transfiguration",
      studentId: "sp-hermione",
      studentName: "Hermione Granger",
      submissionDate: "2026-07-01T06:00:00Z",
      contentText: "While Gamp's law states that food cannot be created out of nothing, quantum vacuum energy fluctuations suggest that a high-intensity baryon collector could theoretically manifest nutritious matter from virtual particle pairs, though it would require more power than a standard star has to offer.",
      status: "Submitted"
    }
  ];
  submissions.push(...seedSubmissions);

  // 7. Seed Messages
  const seedMessages: Message[] = [
    {
      id: "msg-1",
      senderId: "u-teacher1",
      senderName: "Dr. Clara Oswald",
      senderRole: "teacher",
      recipientRole: "student",
      text: "Please remember to submit your EPR Paradox lab report before the Sunday deadline. Virtual assistance office hours will be held this Wednesday at 4 PM.",
      timestamp: "2026-06-30T14:15:00Z"
    },
    {
      id: "msg-2",
      senderId: "u-admin",
      senderName: "Director Sarah Jenkins",
      senderRole: "admin",
      recipientRole: "all",
      text: "Welcome back to the Summer Session. The system is upgraded to 'Cosmic Slate' v2.4. Server telemetry is active and running beautifully.",
      timestamp: "2026-07-01T08:00:00Z"
    }
  ];
  messages.push(...seedMessages);

  // 8. Seed Reminders
  const seedReminders: Reminder[] = [
    {
      id: "rem-1",
      classroomId: "c-astronomy",
      classroomName: "Quantum Physics & Astronomy",
      type: "Exam",
      title: "Midterm: Stellar Spectroscopy & Quantum States",
      content: "Bring scientific calculators and an optical star chart. Formula sheets will be provided.",
      targetDate: "2026-07-12"
    },
    {
      id: "rem-2",
      classroomId: "c-transfiguration",
      classroomName: "Advanced Transfiguration Theory",
      type: "Virtual Session",
      title: "Virtual Lab: Subatomic Lattice Re-configuration",
      content: "Ensure your connection to the grid simulation is established before 11:00 AM.",
      targetDate: "2026-07-02"
    }
  ];
  reminders.push(...seedReminders);
}

// Perform initial seeding
seedDatabase();

// --- API ROUTES ---

// 1. Auth Endpoint
app.post("/api/auth/login", (req, res) => {
  const { email, role } = req.body;
  
  if (!email || !role) {
    return res.status(400).json({ error: "Email and role are required." });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials. Please select the correct email and role." });
  }

  // Session redirect logic (re-implemented server side JSON instruction for frontend router)
  let redirectUrl = "/login";
  if (user.role === "admin") redirectUrl = "/admin-panel";
  if (user.role === "teacher") redirectUrl = "/dashboard/teacher";
  if (user.role === "student") redirectUrl = "/dashboard/student";
  if (user.role === "parent") redirectUrl = "/dashboard/parent";

  return res.json({ user, redirectUrl });
});

// Get self user
app.get("/api/auth/me", (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.json({ user });
});

// --- ADMIN API ENDPOINTS (Security guarded by role checking) ---
function isAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userId = req.headers["x-user-id"] as string;
  const user = users.find(u => u.id === userId);
  if (user && user.role === "admin") {
    next();
  } else {
    res.status(403).json({ error: "HTTP 403 Forbidden: Administrator clearance required." });
  }
}

// Read All Users
app.get("/api/admin/users", isAdmin, (req, res) => {
  res.json(users);
});

// CRUD Users
app.post("/api/admin/users", isAdmin, (req, res) => {
  const { email, fullName, role } = req.body;
  if (!email || !fullName || !role) {
    return res.status(400).json({ error: "All fields are required." });
  }
  
  const id = "u-" + Math.random().toString(36).substr(2, 9);
  const newUser: User = { id, email, fullName, role };
  users.push(newUser);

  // If student role, create a student profile
  if (role === "student") {
    const parentEmail = `parent.${email.split('@')[0]}@classroom.com`;
    const newProfile: StudentProfile = {
      id: "sp-" + Math.random().toString(36).substr(2, 9),
      userId: id,
      fullName,
      email,
      parentEmail,
      classes: [],
      engagementScore: 75,
      gradesAvg: 80,
      attendanceAvg: 90
    };
    studentProfiles.push(newProfile);
  }

  res.status(201).json(newUser);
});

app.delete("/api/admin/users/:id", isAdmin, (req, res) => {
  const { id } = req.params;
  if (id === "u-admin") {
    return res.status(400).json({ error: "Cannot delete master administrator." });
  }
  users = users.filter(u => u.id !== id);
  studentProfiles = studentProfiles.filter(sp => sp.userId !== id);
  res.json({ success: true });
});

// CRUD Classrooms
app.get("/api/admin/classrooms", isAdmin, (req, res) => {
  res.json(classrooms);
});

app.post("/api/admin/classrooms", isAdmin, (req, res) => {
  const { name, description, teacherId } = req.body;
  if (!name || !teacherId) {
    return res.status(400).json({ error: "Name and Teacher are required." });
  }

  const teacher = users.find(u => u.id === teacherId);
  const id = "c-" + Math.random().toString(36).substr(2, 9);
  const newClassroom: Classroom = {
    id,
    name,
    description: description || "",
    teacherId,
    teacherName: teacher ? teacher.fullName : "Unknown Teacher",
    schedule: []
  };
  classrooms.push(newClassroom);
  res.status(201).json(newClassroom);
});

app.delete("/api/admin/classrooms/:id", isAdmin, (req, res) => {
  const { id } = req.params;
  classrooms = classrooms.filter(c => c.id !== id);
  // Unassign from student profiles
  studentProfiles.forEach(sp => {
    sp.classes = sp.classes.filter(cid => cid !== id);
  });
  res.json({ success: true });
});

// Update student profile class assignments
app.post("/api/admin/students/assign", isAdmin, (req, res) => {
  const { studentProfileId, classroomIds } = req.body;
  const profile = studentProfiles.find(sp => sp.id === studentProfileId);
  if (!profile) {
    return res.status(404).json({ error: "Student profile not found." });
  }
  profile.classes = classroomIds;
  res.json(profile);
});

// Get Server Metrics (Admin exclusive)
app.get("/api/admin/metrics", isAdmin, (req, res) => {
  // Mock live telemetry readings for Cosmic Slate metrics panel
  const totalUsers = users.length;
  const memoryUsed = Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 10) / 10;
  const mockMetrics: ServerMetrics = {
    cpuUsage: Math.round(5 + Math.random() * 8), // 5% - 13% CPU
    memoryUsage: memoryUsed,
    activeSessions: Math.round(4 + Math.random() * 3), // active simulation users
    dbConnectionPool: "SQLite/In-Memory Coherent [OK]",
    uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000)
  };
  res.json(mockMetrics);
});

// Trigger Seeding Command from dashboard
app.post("/api/admin/seed", isAdmin, (req, res) => {
  seedDatabase();
  res.json({ message: "Database re-seeded successfully." });
});

// --- TEACHER API ENDPOINTS (Security guarded by teacher role) ---
function isTeacher(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userId = req.headers["x-user-id"] as string;
  const user = users.find(u => u.id === userId);
  if (user && (user.role === "teacher" || user.role === "admin")) {
    next();
  } else {
    res.status(403).json({ error: "HTTP 403 Forbidden: Teacher clearance required." });
  }
}

// Get all classrooms for teacher
app.get("/api/teacher/classes", isTeacher, (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  const teacherClasses = classrooms.filter(c => c.teacherId === userId || userId === "u-admin");
  res.json(teacherClasses);
});

// Get all students enrolled in a teacher's classes
app.get("/api/teacher/classrooms/:classroomId/students", isTeacher, (req, res) => {
  const { classroomId } = req.params;
  const enrolled = studentProfiles.filter(sp => sp.classes.includes(classroomId));
  res.json(enrolled);
});

// Teacher-Driven Student Enrollment (New Module)
const enrollStudent = (req: express.Request, res: express.Response) => {
  const { fullName, rollId, parentEmail, classroomId } = req.body;
  if (!fullName || !rollId || !parentEmail || !classroomId) {
    return res.status(400).json({ error: "Name, Roll/ID, Parent Email, and Classroom ID are required." });
  }

  // Create clean student email from roll ID
  const email = `student.${rollId}@classroom.com`;
  
  // Check if user already exists
  let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  let studentProfile = studentProfiles.find(sp => sp.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    const id = "u-" + Math.random().toString(36).substr(2, 9);
    user = { id, email, fullName, role: "student" };
    users.push(user);
  }

  if (!studentProfile) {
    studentProfile = {
      id: "sp-" + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      fullName,
      email,
      parentEmail,
      classes: [classroomId],
      engagementScore: 80,
      gradesAvg: 0,
      attendanceAvg: 0
    };
    studentProfiles.push(studentProfile);
  } else {
    // If profile exists, just append classroomId if not already there
    if (!studentProfile.classes.includes(classroomId)) {
      studentProfile.classes.push(classroomId);
    }
  }

  res.status(201).json({ success: true, user, studentProfile });
};

app.post("/api/teacher/students/add", isTeacher, enrollStudent);
app.post("/students/add/", isTeacher, enrollStudent);

// Save or Update Roll Call Attendance
app.post("/api/teacher/attendance", isTeacher, (req, res) => {
  const { classroomId, date, records } = req.body; // records: Array<{studentId, status}>
  if (!classroomId || !date || !records) {
    return res.status(400).json({ error: "Missing required arguments." });
  }

  records.forEach((record: { studentId: string; status: "Present" | "Absent" | "Late" }) => {
    // Find existing attendance
    const existingIndex = attendances.findIndex(
      att => att.studentId === record.studentId && att.classroomId === classroomId && att.date === date
    );

    const student = studentProfiles.find(sp => sp.id === record.studentId);
    const studentName = student ? student.fullName : "Unknown Student";

    const attendanceRecord: Attendance = {
      id: existingIndex >= 0 ? attendances[existingIndex].id : "att-" + Math.random().toString(36).substr(2, 9),
      studentId: record.studentId,
      studentName,
      classroomId,
      date,
      status: record.status
    };

    if (existingIndex >= 0) {
      attendances[existingIndex] = attendanceRecord;
    } else {
      attendances.push(attendanceRecord);
    }
  });

  // Re-calculate attendance average for modified students
  records.forEach((record: { studentId: string }) => {
    const student = studentProfiles.find(sp => sp.id === record.studentId);
    if (student) {
      const studentRecords = attendances.filter(att => att.studentId === student.id);
      const presentCount = studentRecords.filter(att => att.status === "Present").length;
      const lateCount = studentRecords.filter(att => att.status === "Late").length;
      const totalCount = studentRecords.length;
      
      // Calculate attendanceAvg: (Present + 0.8 * Late) / Total
      if (totalCount > 0) {
        student.attendanceAvg = Math.round(((presentCount + lateCount * 0.8) / totalCount) * 100);
      }
    }
  });

  res.json({ success: true, message: "Attendance roll call saved successfully." });
});

// Single row update attendance (Django API format)
app.post("/attendance/update/", isTeacher, (req, res) => {
  const { student_id, classroom_id, status, date } = req.body;
  if (!student_id || !classroom_id || !status || !date) {
    return res.status(400).json({ error: "Missing required arguments: student_id, classroom_id, status, date." });
  }

  // Find existing attendance
  const existingIndex = attendances.findIndex(
    att => att.studentId === student_id && att.classroomId === classroom_id && att.date === date
  );

  const student = studentProfiles.find(sp => sp.id === student_id);
  const studentName = student ? student.fullName : "Unknown Student";

  const attendanceRecord: Attendance = {
    id: existingIndex >= 0 ? attendances[existingIndex].id : "att-" + Math.random().toString(36).substr(2, 9),
    studentId: student_id,
    studentName,
    classroomId: classroom_id,
    date,
    status
  };

  if (existingIndex >= 0) {
    attendances[existingIndex] = attendanceRecord;
  } else {
    attendances.push(attendanceRecord);
  }

  // Re-calculate attendance average
  if (student) {
    const studentRecords = attendances.filter(att => att.studentId === student.id);
    const presentCount = studentRecords.filter(att => att.status === "Present").length;
    const lateCount = studentRecords.filter(att => att.status === "Late").length;
    const totalCount = studentRecords.length;
    
    if (totalCount > 0) {
      student.attendanceAvg = Math.round(((presentCount + lateCount * 0.8) / totalCount) * 100);
    }
  }

  res.json({ success: true, message: "Attendance updated successfully.", record: attendanceRecord });
});

// Get attendance records for a classroom on a specific date
app.get("/api/teacher/attendance", isTeacher, (req, res) => {
  const { classroomId, date } = req.query;
  if (!classroomId || !date) {
    return res.status(400).json({ error: "Classroom and date are required." });
  }

  const filtered = attendances.filter(
    att => att.classroomId === classroomId && att.date === date
  );
  res.json(filtered);
});

// Routine/Timeline Scheduler Endpoint (Adding / Editing periods with strictly enforced overlap validation)
const editScheduleHandler = (req: express.Request, res: express.Response) => {
  const { classroomId, day, startTime, endTime, room, platform, link } = req.body;

  if (!classroomId || !day || !startTime || !endTime || !room || !platform) {
    return res.status(400).json({ error: "All schedule fields are required." });
  }

  const classroom = classrooms.find(c => c.id === classroomId);
  if (!classroom) {
    return res.status(404).json({ error: "Classroom not found." });
  }

  // 1. Convert times to numbers for range calculations (e.g. '09:30' -> 930)
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const newStartMin = toMinutes(startTime);
  const newEndMin = toMinutes(endTime);

  if (newStartMin >= newEndMin) {
    return res.status(400).json({ error: "Time-Slot Validation Error: Start time must occur before end time." });
  }

  // 2. Strict overlap checks (teacher or room overlap) across all classes
  for (const c of classrooms) {
    for (const item of c.schedule) {
      // Only worry if same day
      if (item.day === day) {
        // Condition: Same Room OR Same Teacher
        const isSameRoom = item.room.toLowerCase() === room.toLowerCase();
        const isSameTeacher = c.teacherId === classroom.teacherId;

        if (isSameRoom || isSameTeacher) {
          const itemStartMin = toMinutes(item.startTime);
          const itemEndMin = toMinutes(item.endTime);

          // Overlap condition: startA < endB and endA > startB
          if (newStartMin < itemEndMin && newEndMin > itemStartMin) {
            const conflictEntity = isSameRoom ? `Room '${room}'` : `Teacher '${classroom.teacherName}'`;
            return res.status(400).json({
              error: `Validation Conflict: Overlapping schedule block detected! ${conflictEntity} is already booked on ${day} between ${item.startTime} and ${item.endTime} in class: '${c.name}'.`
            });
          }
        }
      }
    }
  }

  // 3. Valid block, add/replace
  const newItem: ScheduleItem = { day, startTime, endTime, room, platform, link: link || "" };
  
  // Clean old scheduled slots for same day to act as a replace operation, or append if distinct
  classroom.schedule = classroom.schedule.filter(item => !(item.day === day && item.startTime === startTime));
  classroom.schedule.push(newItem);

  // Keep chronological sorting
  classroom.schedule.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

  res.json({ success: true, classroom });
};

app.post("/api/teacher/schedule/edit", isTeacher, editScheduleHandler);
app.post("/routine/edit/", isTeacher, editScheduleHandler);

// Delete a scheduled period
app.delete("/api/teacher/schedule", isTeacher, (req, res) => {
  const { classroomId, day, startTime } = req.body;
  const classroom = classrooms.find(c => c.id === classroomId);
  if (!classroom) return res.status(404).json({ error: "Classroom not found" });

  classroom.schedule = classroom.schedule.filter(
    item => !(item.day === day && item.startTime === startTime)
  );
  res.json({ success: true, classroom });
});

// CRUD assignments for teachers
app.post("/api/teacher/assignments", isTeacher, (req, res) => {
  const { classroomId, title, description, dueDate, maxPoints } = req.body;
  if (!classroomId || !title || !dueDate || !maxPoints) {
    return res.status(400).json({ error: "Missing required assignment fields." });
  }

  const classroom = classrooms.find(c => c.id === classroomId);
  if (!classroom) return res.status(404).json({ error: "Classroom not found." });

  const id = "as-" + Math.random().toString(36).substr(2, 9);
  const newAssignment: Assignment = {
    id,
    classroomId,
    classroomName: classroom.name,
    title,
    description: description || "",
    dueDate,
    maxPoints: Number(maxPoints)
  };

  assignments.push(newAssignment);
  res.status(201).json(newAssignment);
});

// Get submissions for evaluation
app.get("/api/teacher/submissions", isTeacher, (req, res) => {
  res.json(submissions);
});

// Grade Submissions
app.post("/api/teacher/submissions/:id/grade", isTeacher, (req, res) => {
  const { id } = req.params;
  const { pointsScored, teacherFeedback } = req.body;

  const sub = submissions.find(s => s.id === id);
  if (!sub) return res.status(404).json({ error: "Submission not found" });

  sub.status = "Graded";
  sub.pointsScored = Number(pointsScored);
  sub.teacherFeedback = teacherFeedback || "";

  // Recalculate student grades avg
  const student = studentProfiles.find(sp => sp.id === sub.studentId);
  if (student) {
    const studentSubs = submissions.filter(s => s.studentId === student.id && s.status === "Graded");
    if (studentSubs.length > 0) {
      let totalEarned = 0;
      let totalMax = 0;
      studentSubs.forEach(s => {
        const assign = assignments.find(a => a.id === s.assignmentId);
        if (assign && s.pointsScored !== undefined) {
          totalEarned += s.pointsScored;
          totalMax += assign.maxPoints;
        }
      });
      student.gradesAvg = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 80;
    }
  }

  res.json(sub);
});


// --- STUDENT API ENDPOINTS ---
function isStudent(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userId = req.headers["x-user-id"] as string;
  const user = users.find(u => u.id === userId);
  if (user && (user.role === "student" || user.role === "admin")) {
    next();
  } else {
    res.status(403).json({ error: "HTTP 403 Forbidden: Student clearance required." });
  }
}

// Get student's classroom and profile
app.get("/api/student/profile", isStudent, (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  const profile = studentProfiles.find(sp => sp.userId === userId);
  if (!profile) return res.status(404).json({ error: "Student profile not found" });
  res.json(profile);
});

// Get chronological routine timeline stack for student
app.get("/api/student/timeline", isStudent, (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  const profile = studentProfiles.find(sp => sp.userId === userId);
  if (!profile) return res.status(404).json({ error: "Student profile not found" });

  const enrolledClasses = classrooms.filter(c => profile.classes.includes(c.id));
  
  // Flatten schedules and map to class
  const timeline: any[] = [];
  enrolledClasses.forEach(c => {
    c.schedule.forEach(item => {
      timeline.push({
        classId: c.id,
        className: c.name,
        teacherName: c.teacherName,
        day: item.day,
        startTime: item.startTime,
        endTime: item.endTime,
        room: item.room,
        platform: item.platform,
        link: item.link || "#"
      });
    });
  });

  // Sort timeline chronologically by Day then Start Time
  const dayWeight: Record<string, number> = {
    "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 7
  };

  timeline.sort((a, b) => {
    const dwDiff = (dayWeight[a.day] || 0) - (dayWeight[b.day] || 0);
    if (dwDiff !== 0) return dwDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  res.json(timeline);
});

// Get notices/reminders for student's classrooms
app.get("/api/student/reminders", isStudent, (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  const profile = studentProfiles.find(sp => sp.userId === userId);
  if (!profile) return res.status(404).json({ error: "Student profile not found" });

  const classroomId = req.query.classroomId as string;
  let filteredReminders = reminders;
  if (classroomId) {
    filteredReminders = reminders.filter(r => r.classroomId === classroomId);
  } else {
    filteredReminders = reminders.filter(r => profile.classes.includes(r.classroomId));
  }
  
  // Order chronologically by ID descending
  const sorted = [...filteredReminders].sort((a, b) => b.id.localeCompare(a.id));
  res.json(sorted);
});

// Student Submit Assignment
app.post("/api/student/submissions", isStudent, (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  const profile = studentProfiles.find(sp => sp.userId === userId);
  if (!profile) return res.status(404).json({ error: "Student profile not found" });

  const { assignmentId, contentText } = req.body;
  if (!assignmentId || !contentText) {
    return res.status(400).json({ error: "Assignment and content are required." });
  }

  const assign = assignments.find(a => a.id === assignmentId);
  if (!assign) return res.status(404).json({ error: "Assignment not found." });

  const isLate = new Date() > new Date(assign.dueDate);

  // Check if already submitted
  const existingSubIndex = submissions.findIndex(
    s => s.assignmentId === assignmentId && s.studentId === profile.id
  );

  const subRecord: Submission = {
    id: existingSubIndex >= 0 ? submissions[existingSubIndex].id : "sub-" + Math.random().toString(36).substr(2, 9),
    assignmentId,
    assignmentTitle: assign.title,
    studentId: profile.id,
    studentName: profile.fullName,
    submissionDate: new Date().toISOString(),
    contentText,
    status: isLate ? "Late" : "Submitted"
  };

  if (existingSubIndex >= 0) {
    submissions[existingSubIndex] = subRecord;
  } else {
    submissions.push(subRecord);
  }

  res.json(subRecord);
});


// --- PARENT API ENDPOINTS ---
function isParent(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userId = req.headers["x-user-id"] as string;
  const user = users.find(u => u.id === userId);
  if (user && (user.role === "parent" || user.role === "admin")) {
    next();
  } else {
    res.status(403).json({ error: "HTTP 403 Forbidden: Parent clearance required." });
  }
}

// Get child profiles under parent email
app.get("/api/parent/children", isParent, (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  const parentUser = users.find(u => u.id === userId);
  if (!parentUser) return res.status(404).json({ error: "Parent not found" });

  const children = studentProfiles.filter(sp => sp.parentEmail.toLowerCase() === parentUser.email.toLowerCase());
  res.json(children);
});


// --- GLOBAL ENDPOINTS ---
// Get all users (publicly mock for the dropdown selection on Universal Login Page)
app.get("/api/auth/users-list", (req, res) => {
  // Return email and roles only for easy selection
  const list = users.map(u => ({ email: u.email, fullName: u.fullName, role: u.role }));
  res.json(list);
});

// Messages and Bulletin
app.get("/api/messages", (req, res) => {
  res.json(messages);
});

app.post("/api/messages", (req, res) => {
  const { senderId, recipientRole, text } = req.body;
  const sender = users.find(u => u.id === senderId);
  if (!sender || !text) {
    return res.status(400).json({ error: "Invalid sender or message." });
  }

  const newMsg: Message = {
    id: "msg-" + Math.random().toString(36).substr(2, 9),
    senderId,
    senderName: sender.fullName,
    senderRole: sender.role,
    recipientRole: recipientRole || "all",
    text,
    timestamp: new Date().toISOString()
  };
  messages.push(newMsg);
  res.status(201).json(newMsg);
});

// Reminders
app.get("/api/reminders", (req, res) => {
  res.json(reminders);
});

app.post("/api/reminders", (req, res) => {
  const { classroomId, type, title, content, targetDate } = req.body;
  if (!classroomId || !type || !title || !targetDate) {
    return res.status(400).json({ error: "Missing reminder properties." });
  }
  const classroom = classrooms.find(c => c.id === classroomId);
  const classroomName = classroom ? classroom.name : "System";

  const newReminder: Reminder = {
    id: "rem-" + Math.random().toString(36).substr(2, 9),
    classroomId,
    classroomName,
    type,
    title,
    content: content || "",
    targetDate
  };
  reminders.push(newReminder);
  res.status(201).json(newReminder);
});

app.get("/api/assignments", (req, res) => {
  res.json(assignments);
});

app.get("/api/submissions", (req, res) => {
  res.json(submissions);
});

app.get("/api/student-profiles", (req, res) => {
  res.json(studentProfiles);
});

// --- PLATFORM DEV/BUILD STATIC MOUNTING ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Classroom Backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
