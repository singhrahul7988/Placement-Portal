"use client";
import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  CalendarClock,
  GraduationCap,
  FileText,
  Building2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
}

export default function CompanyLayout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("Recruiter");
  const [userCompany, setUserCompany] = useState("Recruit Sage");
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const savedCollapsedState = localStorage.getItem("companyLayoutCollapsed");
    if (savedCollapsedState === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("companyLayoutCollapsed", String(newState));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserName(user.name || "Recruiter");
        setUserCompany(user.company || user.name || "Recruit Sage");
      } catch {
        setUserName("Recruiter");
        setUserCompany("Recruit Sage");
      }
    }
  }, []);

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/company/dashboard" },
    { name: "Campus Network", icon: Building2, path: "/company/campus-network" },
    { name: "Job Openings", icon: Briefcase, path: "/company/job-openings" },
    { name: "Candidates", icon: Users, path: "/company/candidates" },
    { name: "Interviews", icon: CalendarClock, path: "/company/interviews" },
    { name: "Campus Drives", icon: GraduationCap, path: "/company/campus-drives" },
    { name: "Reports", icon: FileText, path: "/company/reports" },
  ];

  const savedFilters = [
    { name: "Top Tier Colleges", color: "bg-blue-500" },
    { name: "South Region", color: "bg-purple-500" },
  ];

  const activeDrives = [
    { name: "IIT Bombay - SDE", color: "bg-emerald-500" },
    { name: "NIT Trichy - Analyst", color: "bg-amber-500" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`bg-white border-r border-slate-200 fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-72"
      }`}>
        <div className={`px-6 py-5 border-b border-slate-200 flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
            <Building2 size={20} />
          </div>
          {!isCollapsed && (
            <div>
              <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Recruit Sage</div>
              <div className="text-xs text-slate-500">Company</div>
            </div>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className={`p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors absolute -right-3 top-20 shadow-md border border-slate-200 ${
              isCollapsed ? "left-12" : ""
            }`}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-5 space-y-6 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all justify-center ${isCollapsed ? "justify-center" : ""} ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  title={isCollapsed ? item.name : ""}
                >
                  <item.icon size={18} />
                  {!isCollapsed && <span>{item.name}</span>}
                </button>
              );
            })}
          </div>

          {!isCollapsed && (
            <>
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Saved Filters</div>
                <div className="space-y-2">
                  {savedFilters.map((filter) => (
                    <div key={filter.name} className="flex items-center gap-2 px-3 text-sm text-slate-500">
                      <span className={`h-2 w-2 rounded-full ${filter.color}`}></span>
                      <span>{filter.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Active Drives</div>
                <div className="space-y-2">
                  {activeDrives.map((drive) => (
                    <div key={drive.name} className="flex items-center gap-2 px-3 text-sm text-slate-500">
                      <span className={`h-2 w-2 rounded-full ${drive.color}`}></span>
                      <span>{drive.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </nav>

        <div className="px-4 py-4 border-t border-slate-200">
          <div className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors ${isCollapsed ? "justify-center" : ""}`}>
            <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {userName.split(" ").map((part: string) => part[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-700 truncate">{userName}</div>
                <div className="text-xs text-slate-400 truncate">{userCompany}</div>
              </div>
            )}
            {!isCollapsed && (
              <button
                type="button"
                onClick={() => router.push("/company/settings")}
                className="text-slate-400 hover:text-slate-600"
              >
                <Settings size={16} />
              </button>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 ${isCollapsed ? "p-2" : ""}`}
            title={isCollapsed ? "Sign Out" : ""}
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? "ml-20" : "ml-72"}`}>
        {children}
      </div>
    </div>
  );
}
