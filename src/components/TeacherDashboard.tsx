import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Users, 
  FileText, 
  Award, 
  RefreshCw,
  Video,
  MapPin,
  Filter,
  UserPlus,
  Send,
  Bell
} from "lucide-react";
import { Classroom, StudentProfile, Attendance, Assignment, Submission, ScheduleItem, Reminder, ReminderType } from "../types";

interface TeacherProps {
  teacher: any;
}

export default function TeacherDashboard({ teacher }: TeacherProps) {
  // State elements
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, "Present" | "Absent" | "Late">>({});
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [attendanceTab, setAttendanceTab] = useState<"register" | "history">("register");
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historySelectedDate, setHistorySelectedDate] = useState<string>("All");
  
  // Local state for live ongoing session monitoring
  const [currentDay, setCurrentDay] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  // Filter for priority reminders
  const [priorityFilter, setPriorityFilter] = useState<string>("All");

  // Forms & Modal states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDay, setScheduleDay] = useState("Monday");
  const [scheduleStart, setScheduleStart] = useState("09:00");
  const [scheduleEnd, setScheduleEnd] = useState("10:30");
  const [scheduleRoom, setScheduleRoom] = useState("Observatory Alpha");
  const [schedulePlatform, setSchedulePlatform] = useState("In-Person");
  const [scheduleLink, setScheduleLink] = useState("");
  const [scheduleError, setScheduleError] = useState("");

  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignDue, setAssignDue] = useState("");
  const [assignPoints, setAssignPoints] = useState(100);
  const [assignError, setAssignError] = useState("");

  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradingPoints, setGradingPoints] = useState<number>(100);
  const [gradingFeedback, setGradingFeedback] = useState<string>("");
  const [gradingError, setGradingError] = useState("");

  // New Student Enrollment Form State
  const [enrollName, setEnrollName] = useState("");
  const [enrollRollId, setEnrollRollId] = useState("");
  const [enrollParentEmail, setEnrollParentEmail] = useState("");
  const [enrollError, setEnrollError] = useState("");
  const [enrollSuccess, setEnrollSuccess] = useState("");

  // New Priority Reminder Card Form State
  const [isReminderFormOpen, setIsReminderFormOpen] = useState(false);
  const [remType, setRemType] = useState<ReminderType>("Announcement");
  const [remTitle, setRemTitle] = useState("");
  const [remContent, setRemContent] = useState("");
  const [remDate, setRemDate] = useState("");
  const [remError, setRemError] = useState("");

  const [syncStatus, setSyncStatus] = useState("All data synchronized.");

  // Fetch live local clock info
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      setCurrentDay(days[d.getDay()]);
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch classes
  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/teacher/classes", {
        headers: { "x-user-id": teacher.id }
      });
      const data = await res.json();
      if (res.ok) {
        setClasses(data);
        if (data.length > 0 && !selectedClassId) {
          setSelectedClassId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch enrolled students for selected class
  const fetchStudents = async () => {
    if (!selectedClassId) return;
    try {
      const res = await fetch(`/api/teacher/classrooms/${selectedClassId}/students`, {
        headers: { "x-user-id": teacher.id }
      });
      const data = await res.json();
      if (res.ok) {
        setStudents(data);
        fetchAttendanceForDate(attendanceDate, data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch existing attendance logs
  const fetchAttendanceForDate = async (dateStr: string, roster: StudentProfile[]) => {
    if (!selectedClassId) return;
    try {
      const res = await fetch(`/api/teacher/attendance?classroomId=${selectedClassId}&date=${dateStr}`, {
        headers: { "x-user-id": teacher.id }
      });
      const data = await res.json();
      if (res.ok) {
        const tempRecords: Record<string, "Present" | "Absent" | "Late"> = {};
        
        // Initialize roster students with default 'Present'
        roster.forEach(sp => {
          tempRecords[sp.id] = "Present";
        });

        // Overlay with recorded logs from server
        data.forEach((att: Attendance) => {
          tempRecords[att.studentId] = att.status;
        });

        setAttendanceRecords(tempRecords);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch ALL attendance history for the selected classroom
  const fetchAttendanceHistory = async () => {
    if (!selectedClassId) return;
    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/teacher/attendance/history?classroomId=${selectedClassId}`, {
        headers: { "x-user-id": teacher.id }
      });
      const data = await res.json();
      if (res.ok) {
        setAttendanceHistory(data);
      }
      setLoadingHistory(false);
    } catch (err) {
      console.error(err);
      setLoadingHistory(false);
    }
  };

  // Pivoted Matrix Export: Columns are unique dates, rows are students
  const downloadPivotedMatrixExcel = () => {
    if (!activeClass || students.length === 0) {
      triggerSyncMessage("No students in classroom to export.");
      return;
    }

    // 1. Gather all unique dates where attendance was taken
    const uniqueDates = Array.from(new Set(attendanceHistory.map(h => h.date))).sort();

    let csvContent = "\uFEFF"; // UTF-8 BOM
    // Header
    csvContent += "Student Name,Email Address," + uniqueDates.map(d => `"${d}"`).join(",") + ",Total Present,Total Late,Total Absent,Attendance Rate (%)\n";

    // Rows
    sortedStudents.forEach(st => {
      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;

      const rowData = uniqueDates.map(d => {
        const record = attendanceHistory.find(h => h.studentId === st.id && h.date === d);
        if (record) {
          if (record.status === "Present") presentCount++;
          else if (record.status === "Late") lateCount++;
          else if (record.status === "Absent") absentCount++;
          return record.status;
        }
        return "—"; // Not recorded on this day
      });

      const totalCount = presentCount + lateCount + absentCount;
      const rate = totalCount > 0 ? Math.round(((presentCount + lateCount * 0.8) / totalCount) * 100) : "N/A";

      const nameEscaped = `"${st.fullName.replace(/"/g, '""')}"`;
      const emailEscaped = `"${st.email.replace(/"/g, '""')}"`;

      csvContent += `${nameEscaped},${emailEscaped},${rowData.join(",")},${presentCount},${lateCount},${absentCount},${rate}%\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_Matrix_${activeClass.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerSyncMessage("Attendance Matrix exported to Excel successfully.");
  };

  // Chronological log table
  const downloadChronologicalExcel = () => {
    if (!activeClass || attendanceHistory.length === 0) {
      triggerSyncMessage("No history records available to export.");
      return;
    }

    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "Log ID,Date,Student Name,Email Address,Attendance Status,Classroom Name\n";

    const sortedHistory = [...attendanceHistory].sort((a, b) => b.date.localeCompare(a.date));

    sortedHistory.forEach(rec => {
      const student = students.find(s => s.id === rec.studentId);
      const email = student ? student.email : "";

      const idEscaped = `"${rec.id.replace(/"/g, '""')}"`;
      const dateEscaped = `"${rec.date.replace(/"/g, '""')}"`;
      const nameEscaped = `"${rec.studentName.replace(/"/g, '""')}"`;
      const emailEscaped = `"${email.replace(/"/g, '""')}"`;
      const statusEscaped = `"${rec.status.replace(/"/g, '""')}"`;
      const classEscaped = `"${activeClass.name.replace(/"/g, '""')}"`;

      csvContent += `${idEscaped},${dateEscaped},${nameEscaped},${emailEscaped},${statusEscaped},${classEscaped}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_Logs_${activeClass.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerSyncMessage("Chronological log exported to Excel successfully.");
  };

  // Fetch assignments, submissions, and priority reminders
  const fetchTasksAndReminders = async () => {
    if (!selectedClassId) return;
    try {
      // Assignments
      const resA = await fetch("/api/assignments");
      const dataA = await resA.json();
      if (resA.ok) {
        setAssignments(dataA.filter((a: Assignment) => a.classroomId === selectedClassId));
      }

      // Submissions
      const resS = await fetch("/api/submissions");
      const dataS = await resS.json();
      if (resS.ok) {
        setSubmissions(dataS.filter((s: Submission) => s.status !== "Graded"));
      }

      // Reminders
      const resR = await fetch("/api/reminders");
      const dataR = await resR.json();
      if (resR.ok) {
        setReminders(dataR.filter((r: Reminder) => r.classroomId === selectedClassId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [teacher.id]);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents();
      fetchTasksAndReminders();
      fetchAttendanceHistory();
    }
  }, [selectedClassId, attendanceDate]);

  // Sort students alphabetically by fullName
  const sortedStudents = [...students].sort((a, b) => a.fullName.localeCompare(b.fullName));

  // Batch Operation: Mark All Present
  const handleMarkAllPresent = () => {
    const temp: Record<string, "Present" | "Absent" | "Late"> = { ...attendanceRecords };
    students.forEach(s => {
      temp[s.id] = "Present";
    });
    setAttendanceRecords(temp);
    saveAttendance(temp);
    triggerSyncMessage("Batch operation: All roster items marked Present.");
  };

  // Toggle single attendance switch pill
  const handleToggleAttendance = (studentId: string, status: "Present" | "Absent" | "Late") => {
    const updated = {
      ...attendanceRecords,
      [studentId]: status
    };
    setAttendanceRecords(updated);
    
    // Perform single row direct server persistence using update_or_create logic
    saveSingleAttendance(studentId, status);
  };

  // Single persistence
  const saveSingleAttendance = async (studentId: string, status: "Present" | "Absent" | "Late") => {
    try {
      setSyncStatus("Saving record...");
      const res = await fetch("/attendance/update/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": teacher.id
        },
        body: JSON.stringify({
          student_id: studentId,
          classroom_id: selectedClassId,
          status,
          date: attendanceDate
        })
      });
      if (res.ok) {
        setSyncStatus("Saved successfully.");
        // Refresh students to reflect newly aggregated averages
        fetchStudents();
        fetchAttendanceHistory();
        setTimeout(() => setSyncStatus("All data synchronized."), 2000);
      } else {
        setSyncStatus("Failed to save row.");
      }
    } catch (err) {
      setSyncStatus("Persistence offline.");
    }
  };

  // Sync attendance batch fallback
  const saveAttendance = async (recordsToSave: Record<string, "Present" | "Absent" | "Late">) => {
    try {
      setSyncStatus("Synchronizing batch...");
      const mappedRecords = Object.entries(recordsToSave).map(([studentId, status]) => ({
        studentId,
        status
      }));

      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": teacher.id
        },
        body: JSON.stringify({
          classroomId: selectedClassId,
          date: attendanceDate,
          records: mappedRecords
        })
      });

      if (res.ok) {
        setSyncStatus("Saved successfully.");
        fetchStudents(); // Refresh averages
        fetchAttendanceHistory();
        setTimeout(() => setSyncStatus("All data synchronized."), 2000);
      } else {
        setSyncStatus("Sync failed.");
      }
    } catch (err) {
      setSyncStatus("Sync offline.");
    }
  };

  const triggerSyncMessage = (msg: string) => {
    setSyncStatus(msg);
    setTimeout(() => setSyncStatus("All data synchronized."), 3000);
  };

  // Add routine slot (checks collision)
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError("");

    try {
      const res = await fetch("/routine/edit/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": teacher.id
        },
        body: JSON.stringify({
          classroomId: selectedClassId,
          day: scheduleDay,
          startTime: scheduleStart,
          endTime: scheduleEnd,
          room: scheduleRoom,
          platform: schedulePlatform,
          link: scheduleLink
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save scheduled slot.");
      }

      setIsScheduleModalOpen(false);
      setScheduleLink("");
      fetchClasses(); // Reload schedules
      triggerSyncMessage(`Routine slot scheduled for ${scheduleDay}.`);
    } catch (err: any) {
      setScheduleError(err.message);
    }
  };

  // Delete slot
  const handleDeleteSchedule = async (day: string, startTime: string) => {
    if (!window.confirm(`Are you sure you want to delete the scheduled period on ${day} at ${startTime}?`)) return;
    try {
      const res = await fetch("/api/teacher/schedule", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": teacher.id
        },
        body: JSON.stringify({
          classroomId: selectedClassId,
          day,
          startTime
        })
      });

      if (res.ok) {
        fetchClasses();
        triggerSyncMessage("Scheduled slot removed.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Distribute new assignment
  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError("");

    if (!assignTitle || !assignDue) {
      setAssignError("Title and Due Date are required.");
      return;
    }

    try {
      const res = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": teacher.id
        },
        body: JSON.stringify({
          classroomId: selectedClassId,
          title: assignTitle,
          description: assignDesc,
          dueDate: new Date(assignDue).toISOString(),
          maxPoints: assignPoints
        })
      });

      if (res.ok) {
        setAssignTitle("");
        setAssignDesc("");
        setAssignDue("");
        setIsAssignmentModalOpen(false);
        fetchTasksAndReminders();
        triggerSyncMessage("Assignment dispatched to student portal.");
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to distribute assignment.");
      }
    } catch (err: any) {
      setAssignError(err.message);
    }
  };

  // Grade student work
  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    setGradingError("");

    try {
      const res = await fetch(`/api/teacher/submissions/${selectedSubmission.id}/grade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": teacher.id
        },
        body: JSON.stringify({
          pointsScored: gradingPoints,
          teacherFeedback: gradingFeedback
        })
      });

      if (res.ok) {
        setSelectedSubmission(null);
        setGradingFeedback("");
        fetchTasksAndReminders();
        fetchStudents(); // Refresh average grades
        triggerSyncMessage("Grading recorded and synchronized.");
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to save grading.");
      }
    } catch (err: any) {
      setGradingError(err.message);
    }
  };

  // Teacher Driven Student Enrollment
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollError("");
    setEnrollSuccess("");

    if (!enrollName || !enrollRollId || !enrollParentEmail) {
      setEnrollError("All enrollment fields are required.");
      return;
    }

    try {
      const res = await fetch("/api/teacher/students/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": teacher.id
        },
        body: JSON.stringify({
          fullName: enrollName,
          rollId: enrollRollId,
          parentEmail: enrollParentEmail,
          classroomId: selectedClassId
        })
      });

      const data = await res.json();
      if (res.ok) {
        setEnrollName("");
        setEnrollRollId("");
        setEnrollParentEmail("");
        setEnrollSuccess(`Success! Student registered: student.${enrollRollId}@classroom.com`);
        
        // Append newly created student directly to UI state so roster & count update instantly
        setStudents(prev => [...prev, data.studentProfile]);
        triggerSyncMessage("Student enrollment verified & registered.");
      } else {
        setEnrollError(data.error || "Registration error occurred.");
      }
    } catch (err) {
      setEnrollError("Failed to communicate with enrollment backend.");
    }
  };

  // Post Priority Reminder Card
  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setRemError("");

    if (!remTitle || !remDate) {
      setRemError("Title and Event Target Date are required.");
      return;
    }

    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          classroomId: selectedClassId,
          type: remType,
          title: remTitle,
          content: remContent,
          targetDate: remDate
        })
      });

      if (res.ok) {
        setRemTitle("");
        setRemContent("");
        setRemDate("");
        setIsReminderFormOpen(false);
        fetchTasksAndReminders();
        triggerSyncMessage("Priority reminder published to board.");
      } else {
        const data = await res.json();
        setRemError(data.error || "Failed to publish reminder.");
      }
    } catch (err) {
      setRemError("Failed to communicate with reminder services.");
    }
  };

  // Helper to check if scheduled period is currently live / ongoing
  const isSessionOngoing = (day: string, startTime: string, endTime: string) => {
    if (day !== currentDay) return false;
    return currentTime >= startTime && currentTime <= endTime;
  };

  const activeClass = classes.find(c => c.id === selectedClassId);

  // Filter reminders chronologically and by type
  const sortedReminders = [...reminders]
    .filter(r => priorityFilter === "All" || r.type === priorityFilter)
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

  // Calculate dynamic average statistics
  const enrollmentCount = students.length;
  const absenteesCount = Object.values(attendanceRecords).filter(status => status === "Absent").length;
  const activeSubmissionCount = submissions.filter(s => s.status !== "Graded").length;

  return (
    <div className="space-y-8 font-sans pb-20 text-white selection:bg-[#7C3AED]/30 selection:text-white">
      
      {/* SECTION: Top Header Station & Class Switchboard */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-[#161F30] border border-[#26354D] rounded-2xl p-6 gap-6">
        <div>
          <span className="text-[10px] text-[#06B6D4] font-mono uppercase tracking-widest font-semibold">
            Sylhet Polytechnic Institute • Faculty Console
          </span>
          <h1 className="text-2xl font-bold font-display text-white mt-1">
            Welcome Back, {teacher.fullName}
          </h1>
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#06B6D4] animate-pulse"></span>
            <span className="font-mono">{syncStatus}</span>
          </div>
        </div>

        {/* Dynamic Class Selector (Minimum Touch Target 48px) */}
        <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`min-h-[48px] py-3 px-5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all uppercase tracking-wider ${
                selectedClassId === cls.id
                  ? "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/20 border border-transparent"
                  : "bg-[#0B0F17]/60 text-gray-400 border border-[#26354D] hover:text-white hover:border-gray-500"
              }`}
            >
              {cls.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout: Main Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COMPREHENSIVE AREA: Attendance & Routine Timeline */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* MODULE 1: Attendance Registry & History Center (Durable Tabbed Console) */}
          <div className="bg-[#161F30] border border-[#26354D] rounded-2xl p-6 space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#26354D]/50 pb-4">
              <div>
                <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#7C3AED]" />
                  <span>Smart Attendance System</span>
                </h2>
                <div className="flex gap-4 mt-2">
                  <button
                    onClick={() => setAttendanceTab("register")}
                    className={`pb-1 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${
                      attendanceTab === "register"
                        ? "border-[#7C3AED] text-[#7C3AED]"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    Take Attendance
                  </button>
                  <button
                    onClick={() => setAttendanceTab("history")}
                    className={`pb-1 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${
                      attendanceTab === "history"
                        ? "border-[#7C3AED] text-[#7C3AED]"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    Roll Call History
                  </button>
                </div>
              </div>

              {/* Attendance Operations controls */}
              {attendanceTab === "register" ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="bg-[#0B0F17] border border-[#26354D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#06B6D4] min-h-[48px] font-mono"
                  />
                  <button
                    onClick={handleMarkAllPresent}
                    className="min-h-[48px] flex-1 sm:flex-none text-xs font-semibold px-4 py-2.5 bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 border border-[#06B6D4]/40 text-[#06B6D4] rounded-xl transition-all uppercase tracking-wider"
                  >
                    Mark All Present
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={downloadPivotedMatrixExcel}
                    className="min-h-[48px] flex-1 sm:flex-none text-xs font-semibold px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Download Matrix (Excel)</span>
                  </button>
                  <button
                    onClick={downloadChronologicalExcel}
                    className="min-h-[48px] flex-1 sm:flex-none text-xs font-semibold px-4 py-2.5 bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 border border-[#06B6D4]/40 text-[#06B6D4] rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Download Logs (Excel)</span>
                  </button>
                </div>
              )}
            </div>

            {attendanceTab === "register" ? (
              /* Stable Alphabetical Student Table (Original Take Attendance view) */
              <div className="divide-y divide-[#26354D]/50 border border-[#26354D]/50 rounded-xl overflow-hidden bg-[#0B0F17]/30">
                {sortedStudents.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 text-xs font-mono">
                    No students currently enrolled in {activeClass?.name || "this classroom"}.
                  </div>
                ) : (
                  sortedStudents.map((student) => {
                    const currentStatus = attendanceRecords[student.id] || "Present";
                    return (
                      <div 
                        key={student.id} 
                        className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors hover:bg-[#161F30]/40"
                      >
                        {/* Student Info Info Block */}
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-[#161F30] border border-[#26354D] flex items-center justify-center text-xs font-bold text-gray-300">
                            {student.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">{student.fullName}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">{student.email}</div>
                          </div>
                        </div>

                        {/* Interactive Segmented Pill Controls (Strictly static size to block layout shifts, min-h 48px) */}
                        <div className="flex items-center bg-[#0B0F17]/80 border border-[#26354D] rounded-xl p-1 w-full sm:w-auto">
                          {(["Present", "Late", "Absent"] as const).map((status) => {
                            const isActive = currentStatus === status;
                            let pillStyles = "";
                            if (isActive) {
                              if (status === "Present") pillStyles = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold";
                              if (status === "Late") pillStyles = "bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold";
                              if (status === "Absent") pillStyles = "bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold";
                            } else {
                              pillStyles = "text-gray-500 hover:text-gray-300 border-transparent";
                            }

                            return (
                              <button
                                key={status}
                                onClick={() => handleToggleAttendance(student.id, status)}
                                className={`min-h-[44px] flex-1 sm:flex-initial py-2 px-4 text-xs font-semibold rounded-lg border uppercase tracking-wider text-center transition-all ${pillStyles}`}
                              >
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* High-fidelity History Log View with Live Filters */
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search student name..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className="w-full bg-[#0B0F17] border border-[#26354D] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>
                  <div className="w-full sm:w-48">
                    <select
                      value={historySelectedDate}
                      onChange={(e) => setHistorySelectedDate(e.target.value)}
                      className="w-full bg-[#0B0F17] border border-[#26354D] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#7C3AED] font-mono"
                    >
                      <option value="All">All Dates</option>
                      {Array.from(new Set(attendanceHistory.map((h) => h.date)))
                        .sort((a: string, b: string) => b.localeCompare(a))
                        .map((dateStr) => (
                          <option key={dateStr} value={dateStr}>
                            {dateStr}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="border border-[#26354D]/50 rounded-xl overflow-hidden bg-[#0B0F17]/30 max-h-[450px] overflow-y-auto">
                  {loadingHistory ? (
                    <div className="p-12 text-center text-gray-500 text-xs font-mono flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="h-5 w-5 animate-spin text-[#7C3AED]" />
                      <span>Loading historical logs...</span>
                    </div>
                  ) : attendanceHistory.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 text-xs font-mono">
                      No roll call records found in history for this classroom.
                    </div>
                  ) : (() => {
                    const filteredHistory = attendanceHistory.filter((rec) => {
                      const matchesSearch = rec.studentName.toLowerCase().includes(historySearchQuery.toLowerCase());
                      const matchesDate = historySelectedDate === "All" || rec.date === historySelectedDate;
                      return matchesSearch && matchesDate;
                    });

                    if (filteredHistory.length === 0) {
                      return (
                        <div className="p-12 text-center text-gray-500 text-xs font-mono">
                          No historical records matched your active filter criteria.
                        </div>
                      );
                    }

                    return (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#161F30] border-b border-[#26354D]/50 text-gray-400 font-mono text-[10px] uppercase tracking-wider">
                            <th className="p-3 pl-4">Date</th>
                            <th className="p-3">Student Name</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 pr-4 text-right">Quick Edit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#26354D]/30">
                          {filteredHistory.map((rec) => {
                            let statusBadge = "";
                            if (rec.status === "Present") {
                              statusBadge = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                            } else if (rec.status === "Late") {
                              statusBadge = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                            } else if (rec.status === "Absent") {
                              statusBadge = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                            }

                            return (
                              <tr key={rec.id} className="hover:bg-[#161F30]/20 transition-colors">
                                <td className="p-3 pl-4 font-mono text-[11px] text-gray-300">{rec.date}</td>
                                <td className="p-3 font-semibold text-white">{rec.studentName}</td>
                                <td className="p-3">
                                  <span className={`inline-block px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wide ${statusBadge}`}>
                                    {rec.status}
                                  </span>
                                </td>
                                <td className="p-3 pr-4 text-right">
                                  <div className="flex justify-end gap-1">
                                    {(["Present", "Late", "Absent"] as const).map((st) => (
                                      <button
                                        key={st}
                                        onClick={async () => {
                                          setSyncStatus(`Updating...`);
                                          const res = await fetch("/attendance/update/", {
                                            method: "POST",
                                            headers: {
                                              "Content-Type": "application/json",
                                              "x-user-id": teacher.id
                                            },
                                            body: JSON.stringify({
                                              student_id: rec.studentId,
                                              classroom_id: selectedClassId,
                                              status: st,
                                              date: rec.date
                                            })
                                          });
                                          if (res.ok) {
                                            // update local history record state immediately
                                            setAttendanceHistory((prev) =>
                                              prev.map((item) =>
                                                item.id === rec.id ? { ...item, status: st } : item
                                              )
                                            );
                                            fetchStudents(); // refresh general student statistics
                                            triggerSyncMessage("Attendance updated & synchronized.");
                                          } else {
                                            triggerSyncMessage("Update persistence failed.");
                                          }
                                        }}
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono border transition-all ${
                                          rec.status === st
                                            ? st === "Present"
                                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-bold"
                                              : st === "Late"
                                              ? "bg-amber-500/15 border-amber-500/30 text-amber-400 font-bold"
                                              : "bg-rose-500/15 border-rose-500/30 text-rose-400 font-bold"
                                            : "bg-transparent border-transparent text-gray-500 hover:text-gray-300"
                                        }`}
                                      >
                                        {st[0]}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* MODULE 2: Routine Timeline Matrix (Live Status Pulses with Cyan Aura) */}
          <div className="bg-[#161F30] border border-[#26354D] rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-[#26354D]/50 pb-4">
              <div>
                <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#06B6D4]" />
                  <span>Routine Timeline Matrix</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Chronological schedule blocks. Ongoing sessions pulse with a live Cyan Aura.
                </p>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="min-h-[48px] w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2.5 bg-[#7C3AED] text-white rounded-xl hover:bg-[#6D28D9] transition-all uppercase tracking-wider"
              >
                <Plus className="h-4 w-4" />
                <span>Add Period</span>
              </button>
            </div>

            {/* Vertical timeline stack */}
            <div className="space-y-4">
              {!activeClass || !activeClass.schedule || activeClass.schedule.length === 0 ? (
                <div className="p-12 border border-[#26354D]/50 border-dashed rounded-xl text-center text-gray-500 text-xs font-mono">
                  No routine timeline blocks established for {activeClass?.name || "this classroom"}.
                </div>
              ) : (
                activeClass.schedule.map((item, idx) => {
                  const isLive = isSessionOngoing(item.day, item.startTime, item.endTime);
                  return (
                    <div 
                      key={idx}
                      className={`relative flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-2xl gap-4 transition-all border ${
                        isLive
                          ? "bg-[#161F30]/95 border-[#06B6D4] shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-[#06B6D4]/30"
                          : "bg-[#0B0F17]/40 border-[#26354D]/40 hover:border-gray-600"
                      }`}
                    >
                      {/* Left: Day & Time marker */}
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-xl flex flex-col justify-center items-center font-mono ${
                          isLive ? "bg-[#06B6D4]/20 text-[#06B6D4] animate-pulse" : "bg-[#7C3AED]/10 text-[#7C3AED]"
                        }`}>
                          <Clock className="h-4 w-4" />
                          <span className="text-[9px] font-bold uppercase mt-0.5">{item.day.slice(0, 3)}</span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white flex items-center gap-2">
                            <span>{item.day}s {item.startTime} - {item.endTime}</span>
                            {isLive && (
                              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#06B6D4]/25 text-[#06B6D4] text-[9px] font-mono uppercase tracking-widest font-bold animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] inline-block"></span>
                                Live Now
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded bg-[#06B6D4]/10 text-[#06B6D4] text-[9px] font-mono uppercase tracking-wider">
                              {item.platform}
                            </span>
                          </div>
                          
                          <div className="text-[11px] text-gray-400 mt-1 flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-500" /> {item.room}
                            </span>
                            {item.link && (
                              <a 
                                href={item.link} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex items-center gap-1 text-[#06B6D4] hover:underline truncate max-w-xs"
                              >
                                <Video className="h-3 w-3" /> Connect Room
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right delete option */}
                      <button
                        onClick={() => handleDeleteSchedule(item.day, item.startTime)}
                        className="min-h-[44px] min-w-[44px] text-gray-500 hover:text-red-400 p-2.5 rounded-xl hover:bg-red-500/10 transition-all self-end sm:self-auto flex items-center justify-center border border-transparent hover:border-red-500/20"
                        title="Remove routine period"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* RIGHT BAR CONTROLS: Grading, Quick Enrollment, Priority Cards */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* STATS COMPONENT */}
          <div className="bg-[#161F30] border border-[#26354D] rounded-2xl p-6">
            <h3 className="text-xs font-bold font-display text-[#06B6D4] uppercase tracking-widest">
              Live Roster Insights
            </h3>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="bg-[#0B0F17]/50 border border-[#26354D]/40 rounded-xl p-3">
                <span className="text-xl font-bold text-white font-mono">{enrollmentCount}</span>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider mt-1">Enrolled</p>
              </div>
              <div className="bg-[#0B0F17]/50 border border-[#26354D]/40 rounded-xl p-3">
                <span className="text-xl font-bold text-rose-400 font-mono">{absenteesCount}</span>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider mt-1">Absentees</p>
              </div>
              <div className="bg-[#0B0F17]/50 border border-[#26354D]/40 rounded-xl p-3">
                <span className="text-xl font-bold text-amber-400 font-mono">{activeSubmissionCount}</span>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider mt-1">Pending</p>
              </div>
            </div>
          </div>

          {/* NEW MODULE: Teacher-Driven Student Enrollment */}
          <div className="bg-[#161F30] border border-[#26354D] rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-sm font-bold font-display text-white flex items-center gap-2 uppercase tracking-wider">
                <UserPlus className="h-5 w-5 text-[#06B6D4]" />
                <span>Roster Registration Panel</span>
              </h2>
              <p className="text-xs text-gray-400">
                Directly register and append a student to the active classroom roster.
              </p>
            </div>

            {enrollError && (
              <div className="p-3 bg-red-950/30 border border-red-500/20 text-red-300 rounded-xl text-xs font-mono">
                {enrollError}
              </div>
            )}
            {enrollSuccess && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-mono">
                {enrollSuccess}
              </div>
            )}

            <form onSubmit={handleEnrollStudent} className="space-y-3">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">
                  Student Full Name
                </label>
                <input
                  type="text"
                  value={enrollName}
                  onChange={(e) => setEnrollName(e.target.value)}
                  placeholder="e.g. Mahbub Rahman"
                  className="w-full bg-[#0B0F17] border border-[#26354D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">
                    Polytechnic Roll / ID
                  </label>
                  <input
                    type="text"
                    value={enrollRollId}
                    onChange={(e) => setEnrollRollId(e.target.value)}
                    placeholder="e.g. 504932"
                    className="w-full bg-[#0B0F17] border border-[#26354D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#7C3AED] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">
                    Parent Contact Email
                  </label>
                  <input
                    type="email"
                    value={enrollParentEmail}
                    onChange={(e) => setEnrollParentEmail(e.target.value)}
                    placeholder="parent@email.com"
                    className="w-full bg-[#0B0F17] border border-[#26354D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[48px] flex items-center justify-center gap-1.5 py-3 px-4 bg-[#06B6D4]/10 hover:bg-[#06B6D4]/25 border border-[#06B6D4]/40 text-[#06B6D4] font-semibold text-xs rounded-xl transition-all uppercase tracking-widest"
              >
                <Plus className="h-4 w-4" />
                <span>Enroll Student</span>
              </button>
            </form>
          </div>

          {/* MODULE 3: Assignment Grading Evaluation Panel */}
          <div className="bg-[#161F30] border border-[#26354D] rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-sm font-bold font-display text-white flex items-center gap-2 uppercase tracking-wider">
                <Award className="h-5 w-5 text-[#7C3AED]" />
                <span>Submissions Queue</span>
              </h2>
              <p className="text-xs text-gray-400">
                Grade student workspace submissions. Select a card to open the Dual-Pane evaluator.
              </p>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {submissions.filter(s => s.status !== "Graded").length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-xs font-mono border border-dashed border-[#26354D] rounded-xl">
                  Evaluation queue cleared.
                </div>
              ) : (
                submissions.filter(s => s.status !== "Graded").map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubmission(sub);
                      setGradingPoints(100);
                      setGradingFeedback("");
                      setGradingError("");
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedSubmission?.id === sub.id
                        ? "bg-[#7C3AED]/10 border-[#7C3AED] ring-1 ring-[#7C3AED]"
                        : "bg-[#0B0F17]/40 border-[#26354D]/50 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex justify-between items-start text-xs font-semibold text-white">
                      <span className="truncate max-w-[170px]">{sub.studentName}</span>
                      <span className="text-amber-400 font-mono uppercase tracking-wider text-[9px] bg-amber-500/10 px-2 py-0.5 rounded">
                        {sub.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#06B6D4] font-mono mt-1.5 truncate">{sub.assignmentTitle}</div>
                    <p className="text-[11px] text-gray-400 mt-2 line-clamp-2 italic">
                      "{sub.contentText}"
                    </p>
                  </button>
                ))
              )}
            </div>

            {/* Create Assignment distribution button */}
            <button
              onClick={() => setIsAssignmentModalOpen(true)}
              className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 bg-[#7C3AED]/20 border border-[#7C3AED] hover:bg-[#7C3AED]/30 text-white font-semibold text-xs rounded-xl transition-all uppercase tracking-wider"
            >
              <BookOpen className="h-4 w-4 text-[#06B6D4]" />
              <span>Distribute Coursework</span>
            </button>
          </div>

          {/* MODULE 4: Task Announcements & Dynamic Priority Cards */}
          <div className="bg-[#161F30] border border-[#26354D] rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#26354D]/40 pb-3">
              <div>
                <h3 className="text-sm font-bold font-display text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Bell className="h-4.5 w-4.5 text-[#06B6D4]" />
                  <span>Priority Board</span>
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Urgent priority events and tasks</p>
              </div>

              {/* Priority Dynamic Filter */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Filter className="h-3.5 w-3.5 text-gray-500" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-[#0B0F17] border border-[#26354D] rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none"
                >
                  <option value="All">All Types</option>
                  <option value="Exam">Exam</option>
                  <option value="Deadline">Deadline</option>
                  <option value="Announcement">Announce</option>
                  <option value="Virtual Session">Virtual</option>
                </select>
              </div>
            </div>

            {/* Post button */}
            {!isReminderFormOpen ? (
              <button
                onClick={() => setIsReminderFormOpen(true)}
                className="w-full py-2 px-3 bg-[#0B0F17] hover:bg-[#0B0F17]/80 border border-[#26354D] text-gray-400 hover:text-white rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Priority Card</span>
              </button>
            ) : (
              <form onSubmit={handleAddReminder} className="bg-[#0B0F17]/70 border border-[#26354D] p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold text-white border-b border-[#26354D]/50 pb-1.5">
                  <span>New Priority Item</span>
                  <button type="button" onClick={() => setIsReminderFormOpen(false)} className="text-gray-500 hover:text-white">✕</button>
                </div>

                {remError && <div className="text-[10px] text-red-400 font-mono">{remError}</div>}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] uppercase text-gray-400 mb-1">Type</label>
                    <select
                      value={remType}
                      onChange={(e) => setRemType(e.target.value as ReminderType)}
                      className="w-full bg-[#161F30] border border-[#26354D] rounded-lg p-1 text-xs text-white"
                    >
                      <option value="Announcement">Announcement</option>
                      <option value="Exam">Exam</option>
                      <option value="Deadline">Deadline</option>
                      <option value="Virtual Session">Virtual Session</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase text-gray-400 mb-1">Target Date</label>
                    <input
                      type="date"
                      value={remDate}
                      onChange={(e) => setRemDate(e.target.value)}
                      className="w-full bg-[#161F30] border border-[#26354D] rounded-lg p-1 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] uppercase text-gray-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={remTitle}
                    onChange={(e) => setRemTitle(e.target.value)}
                    placeholder="Midterm Lab Exam Schedule"
                    className="w-full bg-[#161F30] border border-[#26354D] rounded-lg p-1 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase text-gray-400 mb-1">Notes Description</label>
                  <textarea
                    value={remContent}
                    onChange={(e) => setRemContent(e.target.value)}
                    placeholder="Mandatory attendance for CST Batch-A students..."
                    rows={2}
                    className="w-full bg-[#161F30] border border-[#26354D] rounded-lg p-1 text-xs text-white placeholder-gray-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-1.5 bg-[#06B6D4] hover:bg-[#06B6D4]/90 text-black font-semibold text-xs rounded-lg transition-all"
                >
                  Publish Priority Card
                </button>
              </form>
            )}

            {/* Rendered dynamic card stack */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {sortedReminders.length === 0 ? (
                <div className="py-6 text-center text-gray-500 text-xs font-mono">No active priority alerts.</div>
              ) : (
                sortedReminders.map((rem) => {
                  let borderCol = "border-l-4 border-l-[#7C3AED]";
                  let badgeCol = "bg-[#7C3AED]/10 text-[#7C3AED]";
                  if (rem.type === "Exam") {
                    borderCol = "border-l-4 border-l-rose-500";
                    badgeCol = "bg-rose-500/10 text-rose-400";
                  } else if (rem.type === "Deadline") {
                    borderCol = "border-l-4 border-l-amber-500";
                    badgeCol = "bg-amber-500/10 text-amber-400";
                  } else if (rem.type === "Virtual Session") {
                    borderCol = "border-l-4 border-l-[#06B6D4]";
                    badgeCol = "bg-[#06B6D4]/10 text-[#06B6D4]";
                  }

                  return (
                    <div 
                      key={rem.id} 
                      className={`p-3 bg-[#0B0F17]/60 border border-[#26354D]/50 rounded-xl flex flex-col gap-1.5 ${borderCol}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] px-2 py-0.5 font-bold uppercase rounded font-mono ${badgeCol}`}>
                          {rem.type}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {rem.targetDate}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-white leading-tight">{rem.title}</h4>
                      {rem.content && <p className="text-[11px] text-gray-400 leading-relaxed">{rem.content}</p>}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* MODAL 1: ADD SCHEDULE PERIOD */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0F17]/90 animate-fadeIn">
          <div className="bg-[#161F30] border border-[#26354D] rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-start border-b border-[#26354D]/50 pb-3">
              <div>
                <h3 className="text-md font-bold font-display text-white">Add Scheduled Period</h3>
                <p className="text-xs text-gray-400 mt-1">Schedules are verified for overlaps in real-time.</p>
              </div>
              <button 
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {scheduleError && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 text-rose-200 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{scheduleError}</span>
              </div>
            )}

            <form onSubmit={handleAddSchedule} className="space-y-4 text-xs text-white">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 mb-1">Weekly Day</label>
                  <select 
                    value={scheduleDay} 
                    onChange={(e) => setScheduleDay(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-[#0B0F17] border border-[#26354D] rounded-xl text-white min-h-[44px]"
                  >
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 mb-1">Platform Style</label>
                  <select 
                    value={schedulePlatform} 
                    onChange={(e) => setSchedulePlatform(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-[#0B0F17] border border-[#26354D] rounded-xl text-white min-h-[44px]"
                  >
                    {["In-Person", "Zoom", "Google Meet"].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 mb-1">Start Time</label>
                  <input 
                    type="time" 
                    value={scheduleStart} 
                    onChange={(e) => setScheduleStart(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-[#0B0F17] border border-[#26354D] rounded-xl text-white font-mono min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 mb-1">End Time</label>
                  <input 
                    type="time" 
                    value={scheduleEnd} 
                    onChange={(e) => setScheduleEnd(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-[#0B0F17] border border-[#26354D] rounded-xl text-white font-mono min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-gray-400 mb-1">Room Location Name</label>
                <input 
                  type="text" 
                  value={scheduleRoom} 
                  onChange={(e) => setScheduleRoom(e.target.value)}
                  placeholder="Observatory Alpha"
                  className="block w-full px-3 py-2.5 bg-[#0B0F17] border border-[#26354D] rounded-xl text-white placeholder-gray-600 min-h-[44px]"
                />
              </div>

              {schedulePlatform !== "In-Person" && (
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 mb-1">Virtual Conference Link</label>
                  <input 
                    type="url" 
                    value={scheduleLink} 
                    onChange={(e) => setScheduleLink(e.target.value)}
                    placeholder="https://zoom.us/j/123456"
                    className="block w-full px-3 py-2.5 bg-[#0B0F17] border border-[#26354D] rounded-xl text-white placeholder-gray-600 font-mono min-h-[44px]"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full min-h-[48px] py-3 bg-[#7C3AED] hover:bg-[#6D28D9] font-bold text-xs rounded-xl shadow-lg shadow-[#7C3AED]/20 transition-all uppercase tracking-widest"
              >
                Save Schedule Slot
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE ASSIGNMENT */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0F17]/90 animate-fadeIn">
          <div className="bg-[#161F30] border border-[#26354D] rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-start border-b border-[#26354D]/50 pb-3">
              <div>
                <h3 className="text-md font-bold font-display text-white">Distribute Assignment</h3>
                <p className="text-xs text-gray-400 mt-1">Coursework will propagate directly to student rosters.</p>
              </div>
              <button 
                onClick={() => setIsAssignmentModalOpen(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {assignError && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-200 rounded-xl text-xs font-mono">
                {assignError}
              </div>
            )}

            <form onSubmit={handleAddAssignment} className="space-y-4 text-xs text-white">
              <div>
                <label className="block text-[10px] uppercase text-gray-400 mb-1 font-semibold">Assignment Title</label>
                <input 
                  type="text" 
                  value={assignTitle} 
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="Lab Report: Bell State Calculations"
                  className="block w-full px-3 py-2.5 bg-[#0B0F17] border border-[#26354D] rounded-xl text-white placeholder-gray-600 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-gray-400 mb-1 font-semibold">Tasks Description / Prompts</label>
                <textarea 
                  value={assignDesc} 
                  onChange={(e) => setAssignDesc(e.target.value)}
                  placeholder="Plot photon coherence vectors..."
                  rows={3}
                  className="block w-full px-3 py-2.5 bg-[#0B0F17] border border-[#26354D] rounded-xl text-white placeholder-gray-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 mb-1 font-semibold">Due Date & Time</label>
                  <input 
                    type="datetime-local" 
                    value={assignDue} 
                    onChange={(e) => setAssignDue(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-[#0B0F17] border border-[#26354D] rounded-xl text-white min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 mb-1 font-semibold">Maximum Points</label>
                  <input 
                    type="number" 
                    value={assignPoints} 
                    onChange={(e) => setAssignPoints(Number(e.target.value))}
                    className="block w-full px-3 py-2.5 bg-[#0B0F17] border border-[#26354D] rounded-xl text-white font-mono min-h-[44px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[48px] py-3 bg-[#7C3AED] hover:bg-[#6D28D9] font-bold text-xs rounded-xl shadow-lg shadow-[#7C3AED]/20 transition-all uppercase tracking-widest"
              >
                Distribute Coursework
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESPONSIBLE DUAL-PANE GRADING EVALUATOR (NEW IMPRESSIVE PANEL) */}
      {selectedSubmission && (() => {
        const associatedAssignment = assignments.find(a => a.id === selectedSubmission.assignmentId);
        const maxPts = associatedAssignment ? associatedAssignment.maxPoints : 100;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0F17]/95 overflow-y-auto animate-fadeIn">
            <div className="bg-[#161F30] border border-[#26354D] rounded-3xl max-w-4xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative">
              
              {/* Header section */}
              <div className="flex justify-between items-start border-b border-[#26354D]/50 pb-4">
                <div>
                  <span className="text-[10px] text-[#06B6D4] font-mono uppercase tracking-widest font-semibold">
                    Submission Evaluator Workspace
                  </span>
                  <h3 className="text-lg font-bold font-display text-white mt-1">
                    Grading: {selectedSubmission.studentName}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Task: <span className="text-[#7C3AED] font-semibold">{selectedSubmission.assignmentTitle}</span>
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-white font-bold p-1 hover:bg-white/5 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {gradingError && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-200 rounded-xl text-xs font-mono">
                  {gradingError}
                </div>
              )}

              {/* DUAL PANE PANEL */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
                
                {/* Left Pane: Student Text Work View (55%) */}
                <div className="md:col-span-7 flex flex-col space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase text-gray-400 tracking-wider font-bold">
                      Student Content Submission
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      Sent: {new Date(selectedSubmission.submissionDate).toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Scrollable Work Output with Slate Code-Box Styling */}
                  <div className="flex-1 bg-[#0B0F17] border border-[#26354D] rounded-2xl p-5 overflow-y-auto min-h-[220px] max-h-[360px] relative">
                    <p className="text-xs leading-relaxed text-gray-300 font-mono whitespace-pre-wrap selection:bg-[#06B6D4]/45 select-text">
                      {selectedSubmission.contentText}
                    </p>
                  </div>
                </div>

                {/* Right Pane: Range Slider & Commentary Form (45%) */}
                <div className="md:col-span-5 bg-[#0B0F17]/30 border border-[#26354D]/50 rounded-2xl p-5 flex flex-col justify-between">
                  <form onSubmit={handleGradeSubmission} className="space-y-4">
                    <div>
                      <div className="flex justify-between items-baseline mb-1">
                        <label className="block text-[10px] uppercase text-gray-400 tracking-wider font-semibold">
                          Award Points
                        </label>
                        <span className="text-lg font-bold text-[#06B6D4] font-mono bg-[#06B6D4]/10 border border-[#06B6D4]/20 px-2.5 py-0.5 rounded-xl">
                          {gradingPoints} <span className="text-[10px] font-normal text-gray-400">/ {maxPts}</span>
                        </span>
                      </div>

                      {/* HTML5 Range Slider with interactive state, min-h 48px */}
                      <input
                        type="range"
                        min="0"
                        max={maxPts}
                        value={gradingPoints}
                        onChange={(e) => setGradingPoints(Number(e.target.value))}
                        className="w-full h-2 bg-[#0B0F17] rounded-lg appearance-none cursor-pointer accent-[#7C3AED] py-4"
                      />
                      <div className="flex justify-between text-[9px] text-gray-500 font-mono mt-0.5">
                        <span>0 Pts</span>
                        <span>Midpoint ({Math.round(maxPts / 2)})</span>
                        <span>{maxPts} Max</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-gray-400 tracking-wider font-semibold mb-1">
                        Qualitative Feedback Commentary
                      </label>
                      <textarea
                        value={gradingFeedback}
                        onChange={(e) => setGradingFeedback(e.target.value)}
                        placeholder="Excellent delivery and structure! Ensure photon vector components align correctly in future trials."
                        rows={5}
                        className="w-full bg-[#0B0F17] border border-[#26354D] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>

                    {/* Operational controls with touch targets > 48px */}
                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="submit"
                        className="flex-1 min-h-[48px] py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-emerald-900/15"
                      >
                        Submit Grade
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSubmission(null)}
                        className="min-h-[48px] py-3 px-5 bg-gray-800 text-gray-300 font-semibold text-xs rounded-xl hover:bg-gray-700 transition-all uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
