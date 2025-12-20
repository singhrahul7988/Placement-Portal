"use client";
import React, { useState } from "react";
import { LayoutDashboard, Briefcase, FileText, User, LogOut, ChevronLeft, ChevronRight, GraduationCap } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
}

export default function StudentLayout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/student/dashboard" },
    { name: "Job Feed", icon: Briefcase, path: "/student/jobs" },
    { name: "My Resumes", icon: FileText, path: "/student/profile?tab=resumes" },
    { name: "Profile", icon: User, path: "/student/profile?tab=details" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* --- SIDEBAR --- */}
      <aside 
        className={`bg-white border-r border-gray-200 fixed left-0 top-0 h-screen transition-all duration-300 z-50 flex flex-col ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          {!isCollapsed && (
            <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2 animate-in fade-in duration-300">
              <Briefcase className="text-blue-600" /> RecruitSage
            </h2>
          )}
          {isCollapsed && <Briefcase className="text-blue-600 mx-auto" size={24}/>}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors absolute -right-3 top-20 shadow-md border border-gray-200"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-2 mt-4">
          {menuItems.map((item) => {
            // Check if active (handle query params for profile tabs)
            const isActive = pathname === item.path.split('?')[0]; 
            
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${
                  isActive 
                    ? "bg-blue-50 text-blue-700 font-semibold" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                } ${isCollapsed ? "justify-center" : ""}`}
              >
                <item.icon size={22} className={`shrink-0 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600"}`} />
                
                {!isCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}

                {/* Tooltip on Collapse */}
                {isCollapsed && (
                  <div className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {item.name}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div 
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-20" : "ml-64"
        }`}
      >
        {children}
      </div>

    </div>
  );
}