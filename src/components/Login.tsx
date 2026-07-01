import React, { useState } from "react";
import { LogIn, GraduationCap, Shield, User, HelpCircle } from "lucide-react";
import { UserRole } from "../types";

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Quick Account selector values for fluid testing inside the AI Studio iframe
  const demoAccounts = [
    { email: "admin@classroom.com", role: "admin", name: "Director Sarah Jenkins" },
    { email: "clara.oswald@classroom.com", role: "teacher", name: "Dr. Clara Oswald (Physics)" },
    { email: "albus.d@classroom.com", role: "teacher", name: "Prof. Albus Dumbledore (Transfig)" },
    { email: "hermione.g@classroom.com", role: "student", name: "Hermione Granger" },
    { email: "peter.parker@classroom.com", role: "student", name: "Peter Parker" },
    { email: "ron.weasley@classroom.com", role: "student", name: "Ron Weasley" },
    { email: "may.parker@classroom.com", role: "parent", name: "May Parker (Peter's Aunt)" },
    { email: "jean.granger@classroom.com", role: "parent", name: "Jean Granger (Hermione's Mum)" },
    { email: "arthur.weasley@classroom.com", role: "parent", name: "Arthur Weasley (Ron's Dad)" },
  ];

  const handleDemoSelect = (demo: typeof demoAccounts[0]) => {
    setEmail(demo.email);
    setRole(demo.role as UserRole);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please specify an email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || "Unable to contact the login authentication authority.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col justify-center items-center px-4 py-12 font-sans relative overflow-hidden">
      {/* Background ambient decorative cyan/purple aura */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#06B6D4]/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] rounded-2xl shadow-lg shadow-[#7C3AED]/20 mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight leading-tight uppercase">
            Sylhet <span className="text-[#06B6D4]">Polytechnic</span> Institute
          </h1>
          <p className="text-sm text-[#7C3AED] font-semibold uppercase tracking-wider mt-2">
            Smart Classroom Management
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#161F30] border border-[#26354D] rounded-3xl shadow-2xl overflow-hidden p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white tracking-tight">Universal Portal Login</h2>
            <p className="text-xs text-gray-400 mt-1">Provide credentials or select a high-fidelity demo identity below.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-xs flex items-start gap-2 animate-pulse">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider mb-2">
                Authorized Role
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["admin", "teacher", "student", "parent"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-1 text-center rounded-xl text-[11px] font-medium transition-all duration-200 uppercase tracking-wider border ${
                      role === r
                        ? "bg-[#7C3AED]/20 text-white border-[#7C3AED] shadow-sm shadow-[#7C3AED]/10"
                        : "bg-[#0B0F17]/40 text-gray-400 border-[#26354D] hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@classroom.com"
                  className="block w-full pl-10 pr-4 py-3 bg-[#0B0F17]/60 border border-[#26354D] rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                />
              </div>
            </div>

            {/* Simulated Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Access Key
                </label>
                <span className="text-[10px] text-[#06B6D4] font-mono">Bypassed for Demo</span>
              </div>
              <input
                type="password"
                disabled
                value="••••••••••••••"
                className="block w-full px-4 py-3 bg-[#0B0F17]/20 border border-[#26354D]/50 rounded-xl text-gray-600 text-sm focus:outline-none cursor-not-allowed"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.98] text-white font-medium text-sm rounded-xl transition-all duration-150 shadow-lg shadow-[#7C3AED]/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Authenticate Session</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo Fast Selection Drawer */}
        <div className="mt-6 bg-[#161F30]/60 border border-[#26354D]/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3 text-white text-xs font-semibold">
            <Shield className="h-3.5 w-3.5 text-[#06B6D4]" />
            <span>High-Fidelity Sandbox Accounts</span>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {demoAccounts.map((demo) => (
              <button
                key={demo.email}
                onClick={() => handleDemoSelect(demo)}
                className="flex flex-col items-start p-2.5 rounded-lg bg-[#0B0F17]/40 hover:bg-[#7C3AED]/10 border border-[#26354D]/40 text-left transition-all active:scale-[0.97]"
              >
                <span className="text-white text-[11px] font-medium leading-tight truncate w-full">
                  {demo.name}
                </span>
                <span className="text-[9px] font-mono text-[#06B6D4] mt-0.5 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"></span>
                  {demo.role}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-gray-500 text-center flex items-center justify-center gap-1">
            <HelpCircle className="h-3 w-3" />
            <span>Click any fast login to automatically pre-fill inputs.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
