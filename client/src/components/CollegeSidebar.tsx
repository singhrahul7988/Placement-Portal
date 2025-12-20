"use client";
import React from "react";
import { LayoutDashboard, Users, Building2, FileText, Settings, LogOut, School } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CollegeSidebar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const menuItems = [
    { name: "Overview", icon: LayoutDashboard, path: "/college/dashboard" },
    { name: "Student Directory", icon: Users, path: "/college/students" },
    { name: "Company Requests", icon: Building2, path: "/college/partnerships" }, // The Handshake
    { name: "Placement Calendar", icon: FileText, path: "/college/drives" },
    { name: "Settings", icon: Settings, path: "/college/settings" }, // Audit Logs
  ];

  return (
    <div className="w-64 h-screen bg-indigo-900 text-white border-r border-indigo-800 flex flex-col fixed left-0 top-0">
      {/* Logo Area */}
      <div className="p-6 border-b border-indigo-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <School className="text-yellow-400" /> Admin<span className="text-indigo-300">Portal</span>
        </h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => router.push(item.path)}
            className="w-full flex items-center gap-3 px-4 py-3 text-indigo-200 hover:bg-indigo-800 hover:text-white rounded-lg transition-colors font-medium"
          >
            <item.icon size={20} />
            {item.name}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-indigo-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-300 hover:bg-red-900/30 rounded-lg transition-colors font-medium"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
}