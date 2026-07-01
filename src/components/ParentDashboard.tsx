import React, { useState, useEffect } from "react";
import { 
  User, 
  Activity, 
  BookOpen, 
  CheckSquare, 
  MessageCircle, 
  Award, 
  Calendar,
  Sparkles,
  Mail
} from "lucide-react";
import { StudentProfile, Message, Classroom } from "../types";

interface ParentProps {
  parent: any;
}

export default function ParentDashboard({ parent }: ParentProps) {
  const [children, setChildren] = useState<StudentProfile[]>([]);
  const [selectedChild, setSelectedChild] = useState<StudentProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  const fetchData = async () => {
    try {
      // 1. Fetch children
      const resC = await fetch("/api/parent/children", {
        headers: { "x-user-id": parent.id }
      });
      const dataC = await resC.json();
      if (resC.ok && dataC.length > 0) {
        setChildren(dataC);
        setSelectedChild(dataC[0]);
      }

      // 2. Fetch bulletin messages
      const resM = await fetch("/api/messages");
      const dataM = await resM.json();
      if (resM.ok) {
        setMessages(dataM.filter((m: Message) => m.recipientRole === "parent" || m.recipientRole === "all"));
      }

      // 3. Fetch classrooms info
      const resCl = await fetch("/api/admin/classrooms", {
        headers: { "x-user-id": "u-admin" } // use admin mock header safely
      });
      const dataCl = await resCl.json();
      if (resCl.ok) {
        setClassrooms(dataCl);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [parent.id]);

  // Helper calculation for SVG dashoffset
  const getStrokeOffset = (score: number, radius: number = 40) => {
    const circumference = 2 * Math.PI * radius;
    return circumference - (score / 100) * circumference;
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      
      {/* Dashboard Greeting Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#161F30] border border-[#26354D] rounded-2xl p-6 gap-4">
        <div>
          <span className="text-xs text-[#06B6D4] font-mono uppercase tracking-widest">Parent Advisory Console</span>
          <h1 className="text-2xl font-bold font-display text-white mt-1">
            Guardian Account: {parent.fullName}
          </h1>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-[#06B6D4]" />
            <span>Associated Email: <strong className="text-white font-mono">{parent.email}</strong></span>
          </p>
        </div>

        {/* Children selector if multiple children under same parent email */}
        {children.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-semibold">Select Child:</span>
            <div className="flex gap-2">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedChild?.id === child.id
                      ? "bg-[#7C3AED] text-white"
                      : "bg-[#0B0F17]/60 text-gray-400 border border-[#26354D] hover:text-white"
                  }`}
                >
                  {child.fullName}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedChild ? (
        <div className="space-y-8">
          
          {/* Section: Interactive Ring Gauges */}
          <div className="bg-[#161F30] border border-[#26354D] rounded-2xl p-6">
            <h2 className="text-md font-bold font-display text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#06B6D4]" />
              <span>Real-Time Academic & Behavioral Gauges: {selectedChild.fullName}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* Gauge 1: Class Attendance ratio */}
              <div className="bg-[#0B0F17]/40 border border-[#26354D]/40 p-5 rounded-2xl flex flex-col items-center">
                <span className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">Attendance Ratio</span>
                <div className="relative flex justify-center items-center">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="38" fill="transparent" stroke="#161F30" strokeWidth="6" />
                    <circle 
                      cx="48" cy="48" r="38" fill="transparent" 
                      stroke="#06B6D4" strokeWidth="6" 
                      strokeDasharray={2 * Math.PI * 38} 
                      strokeDashoffset={getStrokeOffset(selectedChild.attendanceAvg, 38)}
                      strokeLinecap="round" 
                    />
                  </svg>
                  <div className="absolute font-mono text-lg font-bold text-white">
                    {selectedChild.attendanceAvg}%
                  </div>
                </div>
                <div className="mt-4 text-[10px] text-gray-500 text-center leading-relaxed">
                  Percentage of scheduled classrooms attended.
                </div>
              </div>

              {/* Gauge 2: Grades Average */}
              <div className="bg-[#0B0F17]/40 border border-[#26354D]/40 p-5 rounded-2xl flex flex-col items-center">
                <span className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">Grades Average</span>
                <div className="relative flex justify-center items-center">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="38" fill="transparent" stroke="#161F30" strokeWidth="6" />
                    <circle 
                      cx="48" cy="48" r="38" fill="transparent" 
                      stroke="#7C3AED" strokeWidth="6" 
                      strokeDasharray={2 * Math.PI * 38} 
                      strokeDashoffset={getStrokeOffset(selectedChild.gradesAvg, 38)}
                      strokeLinecap="round" 
                    />
                  </svg>
                  <div className="absolute font-mono text-lg font-bold text-white">
                    {selectedChild.gradesAvg}%
                  </div>
                </div>
                <div className="mt-4 text-[10px] text-gray-500 text-center leading-relaxed">
                  Cumulative score compiled from evaluated assignments.
                </div>
              </div>

              {/* Gauge 3: Interactive Behavioral Engagement */}
              <div className="bg-[#0B0F17]/40 border border-[#26354D]/40 p-5 rounded-2xl flex flex-col items-center">
                <span className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">Engagement Score</span>
                <div className="relative flex justify-center items-center">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="38" fill="transparent" stroke="#161F30" strokeWidth="6" />
                    <circle 
                      cx="48" cy="48" r="38" fill="transparent" 
                      stroke="url(#accentGrad)" strokeWidth="6" 
                      strokeDasharray={2 * Math.PI * 38} 
                      strokeDashoffset={getStrokeOffset(selectedChild.engagementScore, 38)}
                      strokeLinecap="round" 
                    />
                    <defs>
                      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7C3AED" />
                        <stop offset="100%" stopColor="#06B6D4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute font-mono text-lg font-bold text-white">
                    {selectedChild.engagementScore}/100
                  </div>
                </div>
                <div className="mt-4 text-[10px] text-gray-500 text-center leading-relaxed">
                  Evaluation based on classroom activity, questions, and lab performance.
                </div>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Active Course Enrollments */}
            <div className="lg:col-span-7 bg-[#161F30] border border-[#26354D] rounded-2xl p-6">
              <h3 className="text-md font-bold font-display text-white mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#7C3AED]" />
                <span>Class Enrollments & Faculty Info</span>
              </h3>

              <div className="space-y-4">
                {classrooms.filter(c => selectedChild.classes.includes(c.id)).map((cls) => (
                  <div key={cls.id} className="p-4 bg-[#0B0F17]/40 border border-[#26354D]/40 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-white font-display">{cls.name}</h4>
                        <p className="text-[11px] text-gray-400 mt-1">Instructor: <strong className="text-gray-300">{cls.teacherName}</strong></p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#06B6D4]/10 text-[#06B6D4] text-[9px] font-mono uppercase">
                        Enrolled
                      </span>
                    </div>

                    {cls.schedule && cls.schedule.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#26354D]/40 space-y-1.5 text-[11px] text-gray-400 font-mono">
                        <span className="block font-semibold text-[10px] text-gray-500 uppercase">Weekly Roster Times:</span>
                        {cls.schedule.map((sch, sIdx) => (
                          <div key={sIdx} className="flex justify-between">
                            <span>{sch.day}s @ {sch.startTime} - {sch.endTime}</span>
                            <span>{sch.room} ({sch.platform})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Message boards */}
            <div className="lg:col-span-5 bg-[#161F30] border border-[#26354D] rounded-2xl p-6">
              <h3 className="text-md font-bold font-display text-white mb-4 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-[#06B6D4]" />
                <span>Parent Advisories & Notifications</span>
              </h3>

              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-xs">
                    No active messages targeting guardians.
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="p-4 bg-[#0B0F17]/30 border border-[#26354D]/30 rounded-xl">
                      <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 mb-1.5 uppercase">
                        <span>Sender: {msg.senderName}</span>
                        <span>{new Date(msg.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed italic">"{msg.text}"</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-[#161F30] border border-[#26354D] rounded-2xl p-12 text-center text-gray-400 text-sm">
          No registered child profile associated with your guardian email address.
        </div>
      )}

    </div>
  );
}
