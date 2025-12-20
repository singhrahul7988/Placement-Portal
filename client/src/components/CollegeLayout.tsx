"use client";
import React, { useState } from "react";
import { LayoutDashboard, Users, Building2, FileText, Settings, LogOut, School, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
}

export default function CollegeLayout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const menuItems = [
    { name: "Overview", icon: LayoutDashboard, path: "/college/dashboard" },
    { name: "Student Directory", icon: Users, path: "/college/students" },
    { name: "Company Requests", icon: Building2, path: "/college/partnerships" },
    { name: "Placement Calendar", icon: FileText, path: "/college/drives" },
    { name: "Settings", icon: Settings, path: "/college/settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* --- SIDEBAR --- */}
      <aside 
        className={`bg-indigo-900 text-white fixed left-0 top-0 h-screen transition-all duration-300 z-50 flex flex-col border-r border-indigo-800 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Header / Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-indigo-800">
          {!isCollapsed && (
            <h2 className="text-xl font-bold flex items-center gap-2 animate-in fade-in duration-300">
              <School className="text-yellow-400" /> 
              <span>Admin<span className="text-indigo-300">Portal</span></span>
            </h2>
          )}
          {isCollapsed && <School className="text-yellow-400 mx-auto" size={24}/>}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-indigo-200 transition-colors absolute -right-3 top-20 shadow-md border border-indigo-700"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-2 mt-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${
                  isActive ? "bg-indigo-600 text-white shadow-md" : "text-indigo-200 hover:bg-indigo-800 hover:text-white"
                } ${isCollapsed ? "justify-center" : ""}`}
              >
                <item.icon size={22} className={`shrink-0 ${isActive ? "text-white" : "text-indigo-300 group-hover:text-white"}`} />
                
                {!isCollapsed && (
                  <span className="font-medium truncate">{item.name}</span>
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
        <div className="p-3 border-t border-indigo-800">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 text-red-300 hover:bg-red-900/30 rounded-lg transition-colors ${
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
        {/* Pass the children (the page content) here */}
        {children}
      </div>

    </div>
  );
}