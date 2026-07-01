import React, { useState, useEffect } from "react";
import { LogOut, GraduationCap, User, Shield, Terminal, Settings } from "lucide-react";
import Login from "./components/Login.js";
import TeacherDashboard from "./components/TeacherDashboard.js";
import StudentDashboard from "./components/StudentDashboard.js";
import ParentDashboard from "./components/ParentDashboard.js";
import AdminPanel from "./components/AdminPanel.js";
import { User as UserType } from "./types.js";

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session from localStorage on startup
  useEffect(() => {
    const savedUser = localStorage.getItem("cosmic_slate_session");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("cosmic_slate_session");
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (authenticatedUser: UserType) => {
    setUser(authenticatedUser);
    localStorage.setItem("cosmic_slate_session", JSON.stringify(authenticatedUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("cosmic_slate_session");
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not authenticated, force the glassmorphic login page
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-gray-200 font-sans flex flex-col lg:flex-row relative overflow-hidden">
      
      {/* SIDEBAR NAVIGATION - DESKTOP */}
      <aside className="hidden lg:flex w-64 flex-col bg-[#161F30] border-r border-[#26354D] shrink-0 h-screen sticky top-0 justify-between">
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="p-6 flex items-center gap-3 border-b border-[#26354D]/40">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-white font-bold text-xl shadow-[0_0_15px_rgba(124,58,237,0.4)] font-display">
              CS
            </div>
            <div>
              <h1 className="text-xs font-bold tracking-tight uppercase text-white leading-none font-display">
                Sylhet Polytechnic
              </h1>
              <p className="text-[10px] text-[#06B6D4] font-semibold uppercase tracking-widest mt-1">
                Smart Classroom Management
              </p>
            </div>
          </div>

          {/* Role-Based Dynamic Sidebar Navigation */}
          <div className="p-4 space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold px-3 mb-2 block">
              Active Module Navigation
            </span>
            
            {/* Base Active View */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[#7C3AED]/10 text-white rounded-xl border border-[#7C3AED]/20">
              <div className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse"></div>
              <span className="text-xs font-semibold tracking-wide capitalize">{user.role} Core Hub</span>
            </div>

            {/* Dynamic Items Based on Role */}
            {user.role === "admin" && (
              <>
                <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                  <span>Identity Directory</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                  <span>Classrooms CRUD</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                  <span>Enrollments Assigner</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                  <span>System Telemetry</span>
                </div>
              </>
            )}

            {user.role === "teacher" && (
              <>
                <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                  <span>Attendance Registry</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                  <span>Routine Timeline</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                  <span>Assignments Grading</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                  <span>Task Distribution</span>
                </div>
              </>
            )}

            {user.role === "student" && (
              <>
                <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                  <span>Session Timeline</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                  <span>Bulletin alerts</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                  <span>Task Evaluations</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                  <span>Academic Grade Info</span>
                </div>
              </>
            )}

            {user.role === "parent" && (
              <>
                <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                  <span>Progress Gauges</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                  <span>Course Enrollments</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                  <span>Parent Advisories</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar Bottom User Profile & Terminate Session */}
        <div className="p-4 border-t border-[#26354D] space-y-3 bg-[#0B0F17]/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-xs font-bold text-white uppercase font-mono shadow-md">
              {user.fullName.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5 truncate">{user.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 hover:border-rose-500/50 text-rose-200 text-xs font-bold rounded-xl transition-all active:scale-[0.98]"
            title="Logout Session"
            id="logout-btn"
          >
            <LogOut className="h-4 w-4 shrink-0 text-rose-400" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER AREA */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* COMPACT TOP BAR FOR MOBILE/TABLET OR SOPHISTICATED DESKTOP HEADER */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 bg-[#0B0F17] border-b border-[#26354D] shrink-0">
          
          {/* Mobile/Tablet Logo header */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="p-2 bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] rounded-xl shadow-md">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold font-display text-white tracking-wider">
                SYLHET <span className="text-[#06B6D4]">POLYTECHNIC</span>
              </span>
            </div>
          </div>

          {/* Desktop Search Bar Mock - Highly Styled (SOPHISTICATED DARK DESIGN) */}
          <div className="hidden md:flex relative w-80 lg:w-96">
            <input 
              type="text" 
              placeholder="Search entities, records, or logs..." 
              className="w-full bg-[#161F30] border border-[#26354D] rounded-full px-5 py-2 text-xs focus:outline-none focus:border-[#7C3AED] transition-colors placeholder-gray-500 text-white"
              disabled
            />
            <div className="absolute right-4 top-2.5 text-gray-500 text-[9px] font-mono select-none">⌘K</div>
          </div>

          {/* Status widgets */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 bg-[#161F30]/40 px-3 py-1.5 rounded-full border border-[#26354D]/30">
              <div className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse"></div>
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#06B6D4]">Portal Live</span>
            </div>

            {/* Mobile-only session actions */}
            <button
              onClick={handleLogout}
              className="lg:hidden p-2 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-200 text-xs flex items-center justify-center"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* CONTROLLER COMPONENT CONTAINER */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8">
            {user.role === "admin" && (
              <AdminPanel admin={user} onRefreshData={() => {
                const savedUser = localStorage.getItem("cosmic_slate_session");
                if (savedUser) setUser(JSON.parse(savedUser));
              }} />
            )}
            {user.role === "teacher" && <TeacherDashboard teacher={user} />}
            {user.role === "student" && <StudentDashboard student={user} />}
            {user.role === "parent" && <ParentDashboard parent={user} />}
          </div>
        </main>

        {/* SYSTEM STATS FOOTER */}
        <footer className="bg-[#161F30]/40 border-t border-[#26354D]/40 py-4 px-4 sm:px-8 shrink-0">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
              <Terminal className="h-3.5 w-3.5 text-[#06B6D4]" />
              <span>Operational Base Terminal: <span className="text-[#06B6D4]">Node-Coherent 0.0.0.0:3000 [OK]</span></span>
            </div>
            
            <div className="flex items-center gap-4 text-[10px] text-gray-500">
              <span>Sylhet Polytechnic Institute - Smart Classroom Management</span>
              <span>•</span>
              <span>Sophisticated Dark Design System</span>
            </div>
          </div>
        </footer>

      </div>

    </div>
  );
}
