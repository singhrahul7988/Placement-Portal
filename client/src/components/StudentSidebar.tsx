"use client";
import React from "react";
import { LayoutDashboard, Briefcase, FileText, User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StudentSidebar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/student/dashboard" },
    { name: "Job Feed", icon: Briefcase, path: "/student/jobs" },
    // UPDATED PATHS: Added query parameters (?tab=...)
    { name: "My Resumes", icon: FileText, path: "/student/profile?tab=resumes" },
    { name: "Profile", icon: User, path: "/student/profile?tab=details" },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-50">
      {/* Logo Area */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
          <Briefcase className="text-blue-600" /> RecruitSage
        </h2>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => router.push(item.path)}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors font-medium text-left"
          >
            <item.icon size={20} />
            {item.name}
          </button>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
}