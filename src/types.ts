/**
 * Global Type Definitions for Smart Classroom Management System
 */

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface ScheduleItem {
  day: string; // 'Monday', 'Tuesday', etc.
  startTime: string; // '09:00'
  endTime: string; // '10:30'
  room: string;
  platform: string; // 'Zoom', 'In-Person', 'Google Meet'
  link: string;
}

export interface Classroom {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  teacherName: string;
  schedule: ScheduleItem[];
}

export interface StudentProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  parentEmail: string;
  classes: string[]; // Classroom IDs
  engagementScore: number; // 0-100
  gradesAvg: number; // Percentage 0-100
  attendanceAvg: number; // Percentage 0-100
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late';

export interface Attendance {
  id: string;
  studentId: string;
  studentName: string;
  classroomId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
}

export interface Assignment {
  id: string;
  classroomId: string;
  classroomName: string;
  title: string;
  description: string;
  dueDate: string; // ISO String
  maxPoints: number;
}

export type SubmissionStatus = 'Submitted' | 'Graded' | 'Late';

export interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  submissionDate: string; // ISO String
  contentText: string;
  status: SubmissionStatus;
  pointsScored?: number;
  teacherFeedback?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientRole: string; // 'all', 'teacher', 'student', 'parent'
  text: string;
  timestamp: string; // ISO String
}

export type ReminderType = 'Exam' | 'Deadline' | 'Virtual Session' | 'Announcement';

export interface Reminder {
  id: string;
  classroomId: string;
  classroomName: string;
  type: ReminderType;
  title: string;
  content: string;
  targetDate: string; // ISO or date string
}

export interface ServerMetrics {
  cpuUsage: number;
  memoryUsage: number;
  activeSessions: number;
  dbConnectionPool: string;
  uptimeSeconds: number;
}
