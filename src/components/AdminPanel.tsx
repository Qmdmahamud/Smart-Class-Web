import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Database, 
  Cpu, 
  Activity, 
  Server, 
  UserPlus, 
  BookOpen, 
  Trash2, 
  RefreshCw,
  Plus,
  Lock,
  Clock,
  UserCheck
} from "lucide-react";
import { User, Classroom, StudentProfile, ServerMetrics } from "../types";

interface AdminProps {
  admin: any;
  onRefreshData?: () => void;
}

export default function AdminPanel({ admin, onRefreshData }: AdminProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([]);
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null);

  // Form states
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"teacher" | "student" | "parent">("student");
  const [userError, setUserError] = useState("");

  const [newClassName, setNewClassName] = useState("");
  const [newClassDesc, setNewClassDesc] = useState("");
  const [newClassTeacherId, setNewClassTeacherId] = useState("");
  const [classError, setClassError] = useState("");

  const [selectedStudentProfileId, setSelectedStudentProfileId] = useState("");
  const [assignedClassroomIds, setAssignedClassroomIds] = useState<string[]>([]);
  const [enrollMsg, setEnrollMsg] = useState("");

  const [syncMsg, setSyncMsg] = useState("Connected to SQLite/JSON in-memory container.");

  const fetchData = async () => {
    try {
      // Users
      const resU = await fetch("/api/admin/users", { headers: { "x-user-id": admin.id } });
      if (resU.ok) setUsers(await resU.json());

      // Classrooms
      const resC = await fetch("/api/admin/classrooms", { headers: { "x-user-id": admin.id } });
      if (resC.ok) setClassrooms(await resC.json());

      // Student profiles
      const resS = await fetch("/api/student-profiles");
      if (resS.ok) {
        const data = await resS.json();
        setStudentProfiles(data);
        if (data.length > 0 && !selectedStudentProfileId) {
          setSelectedStudentProfileId(data[0].id);
          setAssignedClassroomIds(data[0].classes);
        }
      }

      // Telemetry metrics
      fetchMetrics();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/admin/metrics", { headers: { "x-user-id": admin.id } });
      if (res.ok) setMetrics(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchMetrics, 3000); // Poll metrics every 3s
    return () => clearInterval(interval);
  }, [admin.id]);

  useEffect(() => {
    const selected = studentProfiles.find(sp => sp.id === selectedStudentProfileId);
    if (selected) {
      setAssignedClassroomIds(selected.classes);
    }
  }, [selectedStudentProfileId]);

  // Create User (Calls /api/admin/users)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError("");
    if (!newUserFullName || !newUserEmail) {
      setUserError("Please provide all user fields.");
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": admin.id
        },
        body: JSON.stringify({
          fullName: newUserFullName,
          email: newUserEmail,
          role: newUserRole
        })
      });

      const data = await res.json();
      if (res.ok) {
        setNewUserFullName("");
        setNewUserEmail("");
        fetchData();
        setSyncMsg(`Account successfully created for ${newUserFullName}.`);
      } else {
        throw new Error(data.error || "Failed to create user.");
      }
    } catch (err: any) {
      setUserError(err.message);
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string) => {
    if (userId === admin.id) return;
    if (!window.confirm("Are you sure you want to delete this user profile?")) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "x-user-id": admin.id }
      });
      if (res.ok) {
        fetchData();
        setSyncMsg("User successfully deleted.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Classroom
  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    setClassError("");
    if (!newClassName || !newClassTeacherId) {
      setClassError("Please provide name and teacher assignments.");
      return;
    }

    try {
      const res = await fetch("/api/admin/classrooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": admin.id
        },
        body: JSON.stringify({
          name: newClassName,
          description: newClassDesc,
          teacherId: newClassTeacherId
        })
      });

      if (res.ok) {
        setNewClassName("");
        setNewClassDesc("");
        fetchData();
        setSyncMsg(`Classroom ${newClassName} successfully configured.`);
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to create classroom.");
      }
    } catch (err: any) {
      setClassError(err.message);
    }
  };

  // Delete Classroom
  const handleDeleteClassroom = async (classId: string) => {
    if (!window.confirm("Are you sure you want to remove this classroom globally?")) return;

    try {
      const res = await fetch(`/api/admin/classrooms/${classId}`, {
        method: "DELETE",
        headers: { "x-user-id": admin.id }
      });
      if (res.ok) {
        fetchData();
        setSyncMsg("Classroom deleted successfully.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Class assignment checkbox
  const handleToggleClassEnrollment = (classId: string) => {
    if (assignedClassroomIds.includes(classId)) {
      setAssignedClassroomIds(assignedClassroomIds.filter(id => id !== classId));
    } else {
      setAssignedClassroomIds([...assignedClassroomIds, classId]);
    }
  };

  // Save student course enrollments
  const handleSaveEnrollments = async () => {
    setEnrollMsg("");
    try {
      const res = await fetch("/api/admin/students/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": admin.id
        },
        body: JSON.stringify({
          studentProfileId: selectedStudentProfileId,
          classroomIds: assignedClassroomIds
        })
      });

      if (res.ok) {
        setEnrollMsg("Roster class mappings updated successfully.");
        fetchData();
        setTimeout(() => setEnrollMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Idempotent Seeder Command
  const handleTriggerSeed = async () => {
    if (!window.confirm("Triggering auto-seed clears current operational metrics and resets default values. Proceed?")) return;
    try {
      setSyncMsg("Refresing container data...");
      const res = await fetch("/api/admin/seed", {
        method: "POST",
        headers: { "x-user-id": admin.id }
      });
      if (res.ok) {
        fetchData();
        if (onRefreshData) onRefreshData();
        setSyncMsg("Demo models restored cleanly.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const teachers = users.filter(u => u.role === "teacher");

  return (
    <div className="space-y-8 font-sans pb-16">
      
      {/* Admin Title Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#161F30] border border-[#26354D] rounded-2xl p-6 gap-4">
        <div>
          <span className="text-xs text-[#06B6D4] font-mono uppercase tracking-widest">Global Administrative Core</span>
          <h1 className="text-2xl font-bold font-display text-white mt-1">
            Portal Control: {admin.fullName}
          </h1>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>{syncMsg}</span>
          </p>
        </div>

        {/* Re-seed button (Equivalent to seed_classroom.py) */}
        <button
          onClick={handleTriggerSeed}
          className="flex items-center gap-2 px-4 py-3 bg-red-950/30 hover:bg-red-950/50 border border-red-500/40 hover:border-red-500 text-red-200 text-xs font-bold rounded-xl transition-all"
        >
          <Database className="h-4 w-4 text-red-400" />
          <span>Idempotent Auto-Seed Engine</span>
        </button>
      </div>

      {/* METRICS GRID PANEL */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div className="bg-[#161F30] border border-[#26354D] rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-[#7C3AED]/10 rounded-xl text-[#7C3AED]">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">CPU Thread Load</span>
              <span className="text-lg font-bold font-mono text-white">{metrics.cpuUsage}%</span>
            </div>
          </div>

          <div className="bg-[#161F30] border border-[#26354D] rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-[#06B6D4]/10 rounded-xl text-[#06B6D4]">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Heap Allocation</span>
              <span className="text-lg font-bold font-mono text-white">{metrics.memoryUsage} MB</span>
            </div>
          </div>

          <div className="bg-[#161F30] border border-[#26354D] rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-[#7C3AED]/10 rounded-xl text-[#7C3AED]">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Active Sessions</span>
              <span className="text-lg font-bold font-mono text-white">{metrics.activeSessions} threads</span>
            </div>
          </div>

          <div className="bg-[#161F30] border border-[#26354D] rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Connection Pool</span>
              <span className="text-[11px] font-bold font-mono text-emerald-400">SQL/In-Memory [OK]</span>
            </div>
          </div>

          <div className="bg-[#161F30] border border-[#26354D] rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-[#06B6D4]/10 rounded-xl text-[#06B6D4]">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Uptime Elapsed</span>
              <span className="text-sm font-bold font-mono text-white whitespace-nowrap">{metrics.uptimeSeconds}s elapsed</span>
            </div>
          </div>

        </div>
      )}

      {/* ADMIN WORKSPACE: CRUD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: User Management (Create & Read/Delete) */}
        <div className="lg:col-span-4 bg-[#161F30] border border-[#26354D] rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-md font-bold font-display text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#7C3AED]" />
              <span>Identity Directory & Enroll</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">Register faculty, parents, or students into credentials.</p>
          </div>

          {/* Create User Form */}
          <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
            {userError && <div className="text-rose-400">{userError}</div>}
            
            <div>
              <label className="block text-[10px] uppercase text-gray-400 mb-1">Full Legal Name</label>
              <input 
                type="text" 
                value={newUserFullName} 
                onChange={(e) => setNewUserFullName(e.target.value)}
                placeholder="Tony Stark"
                className="block w-full px-3 py-2 bg-[#0B0F17] border border-[#26354D] rounded-xl text-white placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase text-gray-400 mb-1">Assigned Email</label>
              <input 
                type="email" 
                value={newUserEmail} 
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="stark@classroom.com"
                className="block w-full px-3 py-2 bg-[#0B0F17] border border-[#26354D] rounded-xl text-white placeholder-gray-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase text-gray-400 mb-1">Security Role</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as any)}
                className="block w-full px-3 py-2 bg-[#0B0F17] border border-[#26354D] rounded-xl text-white"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 text-white"
            >
              <Plus className="h-4 w-4" />
              <span>Register Identity</span>
            </button>
          </form>

          {/* Users List with Delete */}
          <div className="pt-4 border-t border-[#26354D]/40 space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Registry Roster</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {users.map(u => (
                <div key={u.id} className="p-2.5 bg-[#0B0F17]/30 border border-[#26354D]/30 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <div className="font-semibold text-white truncate max-w-[150px]">{u.fullName}</div>
                    <span className="text-[9px] font-mono text-[#06B6D4] uppercase">{u.role}</span>
                  </div>
                  {u.id !== "u-admin" && (
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-gray-500 hover:text-rose-400 p-1 rounded transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Column: Classrooms Manager */}
        <div className="lg:col-span-4 bg-[#161F30] border border-[#26354D] rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-md font-bold font-display text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#06B6D4]" />
              <span>Academic Classrooms CRUD</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">Configure classes and assign faculty members.</p>
          </div>

          <form onSubmit={handleCreateClassroom} className="space-y-4 text-xs">
            {classError && <div className="text-rose-400">{classError}</div>}

            <div>
              <label className="block text-[10px] uppercase text-gray-400 mb-1">Classroom Name</label>
              <input 
                type="text" 
                value={newClassName} 
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Advanced Quantum Dynamics"
                className="block w-full px-3 py-2 bg-[#0B0F17] border border-[#26354D] rounded-xl text-white placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase text-gray-400 mb-1">Objective Description</label>
              <input 
                type="text" 
                value={newClassDesc} 
                onChange={(e) => setNewClassDesc(e.target.value)}
                placeholder="Thermodynamics equations..."
                className="block w-full px-3 py-2 bg-[#0B0F17] border border-[#26354D] rounded-xl text-white placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase text-gray-400 mb-1">Assigned Instructor</label>
              <select
                value={newClassTeacherId}
                onChange={(e) => setNewClassTeacherId(e.target.value)}
                className="block w-full px-3 py-2 bg-[#0B0F17] border border-[#26354D] rounded-xl text-white"
              >
                <option value="">-- Choose Faculty --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.fullName}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Establish Classroom</span>
            </button>
          </form>

          {/* Classrooms list */}
          <div className="pt-4 border-t border-[#26354D]/40 space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Configured Classes</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {classrooms.map(c => (
                <div key={c.id} className="p-2.5 bg-[#0B0F17]/30 border border-[#26354D]/30 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <div className="font-semibold text-white truncate max-w-[150px]">{c.name}</div>
                    <span className="text-[10px] text-gray-400">Teacher: {c.teacherName}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteClassroom(c.id)}
                    className="text-gray-500 hover:text-rose-400 p-1 rounded transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Student Enrollments (Many-to-Many updates) */}
        <div className="lg:col-span-4 bg-[#161F30] border border-[#26354D] rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-md font-bold font-display text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-[#06B6D4]" />
              <span>Many-to-Many Enrollments Assigner</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">Bind enrolled student profiles directly to classrooms.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] uppercase text-gray-400 mb-1">Select Student Profile</label>
              <select
                value={selectedStudentProfileId}
                onChange={(e) => setSelectedStudentProfileId(e.target.value)}
                className="block w-full px-3 py-2 bg-[#0B0F17] border border-[#26354D] rounded-xl text-white"
              >
                {studentProfiles.map(sp => (
                  <option key={sp.id} value={sp.id}>{sp.fullName}</option>
                ))}
              </select>
            </div>

            {/* Class checkboxes */}
            <div>
              <label className="block text-[10px] uppercase text-gray-400 mb-2">Classroom Mappings</label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 bg-[#0B0F17]/50 border border-[#26354D]/40 p-3 rounded-xl">
                {classrooms.map(cls => {
                  const isChecked = assignedClassroomIds.includes(cls.id);
                  return (
                    <label key={cls.id} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer p-1 rounded hover:bg-[#161F30]/40">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleClassEnrollment(cls.id)}
                        className="rounded border-[#26354D] text-[#7C3AED] focus:ring-[#7C3AED] h-4 w-4 bg-[#0B0F17]"
                      />
                      <span className="truncate">{cls.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {enrollMsg && <div className="text-xs text-emerald-400 font-semibold">{enrollMsg}</div>}

            <button
              onClick={handleSaveEnrollments}
              className="w-full py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-white font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              Save Class Mappings
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
