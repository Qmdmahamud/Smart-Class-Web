import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  ExternalLink, 
  Send, 
  BookOpen, 
  Activity, 
  GraduationCap, 
  CheckCircle,
  Bell,
  AlertCircle
} from "lucide-react";
import { Assignment, Submission, Message, StudentProfile, Reminder } from "../types";

interface StudentProps {
  student: any;
}

export default function StudentDashboard({ student }: StudentProps) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("All");
  
  const [selectedAssignId, setSelectedAssignId] = useState<string>("");
  const [submissionText, setSubmissionText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const fetchData = async () => {
    try {
      // 1. Profile details
      const resP = await fetch("/api/student/profile", {
        headers: { "x-user-id": student.id }
      });
      const dataP = await resP.json();
      if (resP.ok) {
        setProfile(dataP);
      }

      // 2. Schedule Timeline
      const resT = await fetch("/api/student/timeline", {
        headers: { "x-user-id": student.id }
      });
      const dataT = await resT.json();
      if (resT.ok) {
        setTimeline(dataT);
      }

      // 3. Assignments list
      const resA = await fetch("/api/assignments");
      const dataA = await resA.json();
      if (resA.ok) {
        // Enrolled classes assignments
        if (dataP && dataP.classes) {
          setAssignments(dataA.filter((a: Assignment) => dataP.classes.includes(a.classroomId)));
        } else {
          setAssignments(dataA);
        }
      }

      // 4. Submissions
      const resS = await fetch("/api/submissions");
      const dataS = await resS.json();
      if (resS.ok && dataP) {
        setSubmissions(dataS.filter((s: Submission) => s.studentId === dataP.id));
      }

      // 5. Bulletins/Messages
      const resM = await fetch("/api/messages");
      const dataM = await resM.json();
      if (resM.ok) {
        setMessages(dataM.filter((m: Message) => m.recipientRole === "student" || m.recipientRole === "all"));
      }

      // 6. Classroom Notices / Reminders
      const resR = await fetch("/api/student/reminders", {
        headers: { "x-user-id": student.id }
      });
      const dataR = await resR.json();
      if (resR.ok) {
        setReminders(dataR);
      }

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [student.id]);

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignId || !submissionText.trim()) {
      setSubmitError("Submission content cannot be empty.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const res = await fetch("/api/student/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": student.id
        },
        body: JSON.stringify({
          assignmentId: selectedAssignId,
          contentText: submissionText
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitSuccess("Assignment completed and submitted successfully!");
        setSubmissionText("");
        setSelectedAssignId("");
        fetchData(); // Reload submissions list
      } else {
        throw new Error(data.error || "Submission failed.");
      }
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper check status
  const getAssignmentStatus = (assignId: string) => {
    const sub = submissions.find(s => s.assignmentId === assignId);
    if (!sub) return { label: "Assigned", style: "bg-blue-500/10 text-blue-400 border-blue-500/20", subDetails: null };
    if (sub.status === "Graded") return { label: `Graded (${sub.pointsScored}/100)`, style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", subDetails: sub };
    if (sub.status === "Late") return { label: "Late Submission", style: "bg-rose-500/10 text-rose-400 border-rose-500/20", subDetails: sub };
    return { label: "Submitted for Evaluation", style: "bg-amber-500/10 text-amber-400 border-amber-500/20", subDetails: sub };
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      
      {/* Top Banner metrics */}
      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#161F30] border border-[#26354D] rounded-2xl p-6">
          <div className="md:col-span-2 flex items-center gap-4">
            <div className="p-3.5 bg-[#7C3AED]/10 rounded-2xl text-[#7C3AED]">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <span className="text-xs text-[#06B6D4] font-mono uppercase tracking-widest">Enrolled Academy Student</span>
              <h1 className="text-2xl font-bold font-display text-white mt-0.5">{profile.fullName}</h1>
              <p className="text-xs text-gray-400 mt-1">Class portal access authenticated successfully.</p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-col justify-center items-center p-4 bg-[#0B0F17]/40 rounded-xl border border-[#26354D]/40">
            <span className="text-2xl font-bold font-mono text-white">{profile.gradesAvg}%</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Academic Grade</span>
          </div>

          <div className="flex flex-col justify-center items-center p-4 bg-[#0B0F17]/40 rounded-xl border border-[#26354D]/40">
            <span className="text-2xl font-bold font-mono text-[#06B6D4]">{profile.attendanceAvg}%</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Class Attendance</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Routine Timeline stack with Deep-linked launcher buttons */}
        <div className="lg:col-span-7 space-y-8">
          
          <div className="bg-[#161F30] border border-[#26354D] rounded-2xl p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#7C3AED]" />
                <span>My Weekly Session Timeline</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">Synchronized chronological outline of active modules.</p>
            </div>

            <div className="space-y-4">
              {timeline.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">
                  You are not currently scheduled for any active classroom blocks.
                </div>
              ) : (
                timeline.map((item, index) => (
                  <div 
                    key={index}
                    className="p-5 bg-[#0B0F17]/40 border border-[#26354D]/40 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#26354D] transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-[#7C3AED]/15 text-[#7C3AED] text-[10px] font-bold uppercase tracking-wider rounded-lg font-mono">
                          {item.day}
                        </span>
                        <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {item.startTime} - {item.endTime}
                        </span>
                      </div>
                      <h3 className="text-md font-bold text-white mt-2 font-display">{item.className}</h3>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                        <span>Instructor: {item.teacherName}</span>
                        <span>•</span>
                        <span>Room: {item.room}</span>
                      </p>
                    </div>

                    {/* LAUNCH CLASS NOW Deep link */}
                    <div className="w-full sm:w-auto">
                      {item.platform !== "In-Person" && item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] active:scale-[0.98] text-black font-bold text-xs rounded-xl shadow-lg shadow-[#06B6D4]/10 transition-all uppercase tracking-wider"
                        >
                          <span>Launch Class Now</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <div className="text-center px-4 py-2 bg-[#26354D]/30 border border-[#26354D]/50 text-gray-400 text-xs font-semibold rounded-xl">
                          In-Person Attendance
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Classroom Priority Notice Feed */}
          <div className="bg-[#161F30] border border-[#26354D] rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#26354D]/50 pb-3">
              <div>
                <h3 className="text-md font-bold font-display text-white flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#7C3AED]" />
                  <span>Class Notice Board</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">Urgent alerts and notices from your course instructors.</p>
              </div>

              {/* Classroom filter selector */}
              {profile && profile.classes && profile.classes.length > 0 && (
                <select
                  value={selectedClassroomId}
                  onChange={(e) => setSelectedClassroomId(e.target.value)}
                  className="bg-[#0B0F17] border border-[#26354D] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                >
                  <option value="All">All Classes</option>
                  {profile.classes.map((clsId) => {
                    const clsName = timeline.find(t => t.classId === clsId)?.className || clsId;
                    return (
                      <option key={clsId} value={clsId}>
                        {clsName}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {reminders.filter(r => selectedClassroomId === "All" || r.classroomId === selectedClassroomId).length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-xs font-mono border border-dashed border-[#26354D] rounded-xl">
                  No active announcements or priority notices.
                </div>
              ) : (
                reminders
                  .filter(r => selectedClassroomId === "All" || r.classroomId === selectedClassroomId)
                  .map((rem) => {
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
                        className={`p-4 bg-[#0B0F17]/40 border border-[#26354D]/40 rounded-xl flex flex-col gap-1.5 transition-all hover:border-gray-500 ${borderCol}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`text-[9px] px-2 py-0.5 font-bold uppercase rounded font-mono ${badgeCol}`}>
                            {rem.type}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {rem.targetDate}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white font-display leading-tight">{rem.title}</h4>
                        {rem.content && <p className="text-xs text-gray-300 leading-relaxed mt-0.5">{rem.content}</p>}
                        <div className="text-[10px] text-[#06B6D4] font-mono mt-1 text-right">
                          — {rem.classroomName}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Bulletin Board announcements */}
          <div className="bg-[#161F30] border border-[#26354D] rounded-2xl p-6">
            <h3 className="text-md font-bold font-display text-white mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#06B6D4]" />
              <span>Campus Bulletins & Announcements</span>
            </h3>
            
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="py-6 text-center text-gray-500 text-xs">No active bulletin alerts.</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="p-4 bg-[#0B0F17]/30 border border-[#26354D]/30 rounded-xl">
                    <div className="flex justify-between items-center text-[10px] font-mono text-[#06B6D4] uppercase tracking-wider mb-1.5">
                      <span>Sender: {msg.senderName}</span>
                      <span>{new Date(msg.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{msg.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Tasks Submission Console */}
        <div className="lg:col-span-5 space-y-8">
          
          <div className="bg-[#161F30] border border-[#26354D] rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#06B6D4]" />
                <span>Roster Task Evaluations</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">Review active assignments and submit completed reports.</p>
            </div>

            {/* Assignments Selector */}
            <div className="space-y-3">
              {assignments.length === 0 ? (
                <div className="py-6 text-center text-gray-500 text-xs">No assignments mapped to your courses.</div>
              ) : (
                assignments.map((assign) => {
                  const status = getAssignmentStatus(assign.id);
                  const isSelected = selectedAssignId === assign.id;

                  return (
                    <div 
                      key={assign.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isSelected 
                          ? "bg-[#7C3AED]/10 border-[#7C3AED]" 
                          : "bg-[#0B0F17]/40 border-[#26354D]/50 hover:border-[#26354D]"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-white font-display leading-tight">{assign.title}</h4>
                          <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">{assign.classroomName}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${status.style}`}>
                          {status.label}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 mt-2 leading-relaxed">{assign.description}</p>
                      <div className="text-[10px] text-[#06B6D4] font-mono mt-2 flex justify-between">
                        <span>Due: {new Date(assign.dueDate).toLocaleString()}</span>
                        <span>Value: {assign.maxPoints} pts</span>
                      </div>

                      {/* Display evaluation feedback if graded */}
                      {status.subDetails?.teacherFeedback && (
                        <div className="mt-3 p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 text-xs rounded-lg italic">
                          <strong className="not-italic text-white">Feedback:</strong> "{status.subDetails.teacherFeedback}"
                        </div>
                      )}

                      {/* Select to submit if not graded */}
                      {!status.subDetails?.pointsScored && (
                        <button
                          onClick={() => {
                            setSelectedAssignId(assign.id);
                            setSubmitError("");
                            setSubmitSuccess("");
                          }}
                          className="mt-3 w-full py-2 bg-gradient-to-r from-[#7C3AED]/20 to-[#06B6D4]/20 hover:from-[#7C3AED]/30 hover:to-[#06B6D4]/30 border border-[#26354D] text-white text-xs font-semibold rounded-lg transition-all"
                        >
                          {status.subDetails ? "Update Submission" : "Upload Completion Response"}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Submit Response Form */}
            {selectedAssignId && (
              <form onSubmit={handleSubmitAssignment} className="bg-[#0B0F17]/80 border border-[#26354D] rounded-xl p-4 space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center border-b border-[#26354D] pb-2">
                  <span className="text-xs font-semibold text-white truncate max-w-xs">
                    Submitting response...
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setSelectedAssignId("")}
                    className="text-gray-400 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>

                {submitError && <div className="text-xs text-red-400 leading-snug">{submitError}</div>}
                {submitSuccess && <div className="text-xs text-emerald-400 leading-snug">{submitSuccess}</div>}

                <div>
                  <label className="block text-[10px] uppercase text-gray-400 mb-1 font-semibold">Write Report Content</label>
                  <textarea
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Enter mathematical formulations, lab results, or critique essay write-up here..."
                    rows={4}
                    className="block w-full px-3 py-2.5 bg-[#161F30] border border-[#26354D] rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-[#7C3AED]/10"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Submit Completion Response</span>
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

        </div>
      </div>

    </div>
  );
}
