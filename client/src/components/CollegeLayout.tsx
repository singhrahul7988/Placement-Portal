"use client";
import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  BarChart3,
  PieChart,
  Bell,
  MessageSquare,
  Settings,
  LogOut,
  School,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api";

interface LayoutProps {
  children: React.ReactNode;
}

export default function CollegeLayout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("Placement Lead");
  const [userEmail, setUserEmail] = useState("placement@college.edu");
  const [pendingCompanyRequests, setPendingCompanyRequests] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const savedCollapsedState = localStorage.getItem("collegeLayoutCollapsed");
    if (savedCollapsedState === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("collegeLayoutCollapsed", String(newState));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserName(user.name || "Placement Lead");
        setUserEmail(user.email || "placement@college.edu");
      } catch {
        setUserName("Placement Lead");
        setUserEmail("placement@college.edu");
      }
    }
  }, []);

  const loadPendingCompanyRequests = async () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setPendingCompanyRequests(0);
      return;
    }
    try {
      const user = JSON.parse(storedUser);
      const collegeId = user.role === "college" ? user._id : user.collegeId;
      if (!collegeId) {
        setPendingCompanyRequests(0);
        return;
      }
      const { data } = await api.get(`/api/network/requests/${collegeId}`);
      const pendingCount = (data || []).filter((req: any) =>
        req.status === "Pending" && req.requesterId?.role === "company"
      ).length;
      setPendingCompanyRequests(pendingCount);
    } catch {
      setPendingCompanyRequests(0);
    }
  };

  useEffect(() => {
    loadPendingCompanyRequests();
  }, [pathname]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail;
      if (typeof detail === "number") {
        setPendingCompanyRequests(detail);
      }
    };
    window.addEventListener("company-requests-updated", handler as EventListener);
    return () => window.removeEventListener("company-requests-updated", handler as EventListener);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const mainItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/college/dashboard" },
    { name: "Placements", icon: Briefcase, path: "/college/drives" },
    { name: "Students", icon: Users, path: "/college/students" },
    { name: "Companies", icon: Building2, path: "/college/partnerships" },
  ];

  const analyticsItems = [
    { name: "Reports", icon: BarChart3, path: "/college/reports" },
    { name: "Statistics", icon: PieChart, path: "/college/statistics" },
  ];

  const networkItems = [
    {
      name: "Company Requests",
      icon: Building2,
      path: "/college/company-requests",
      badge: pendingCompanyRequests > 0 ? pendingCompanyRequests : undefined,
    },
  ];

  const communicationItems = [
    { name: "Notices", icon: Bell, path: "/college/notices", badge: 3 },
    { name: "Team Talk", icon: MessageSquare, path: "/college/team-talk" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`bg-white border-r border-slate-200 fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-72"
      }`}>
        <div className={`px-6 py-5 border-b border-slate-200 flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
            <School size={20} />
          </div>
          {!isCollapsed && (
            <div>
              <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Recruit Sage</div>
              <div className="text-xs text-slate-500">Placement Cell</div>
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
          <div>
            {!isCollapsed && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Main</div>}
            <div className="space-y-1">
              {mainItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${isCollapsed ? "justify-center" : ""} ${
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
          </div>

          <div>
            {!isCollapsed && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Analytics</div>}
            <div className="space-y-1">
              {analyticsItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <button
                    key={item.name}
                    onClick={() => item.path && router.push(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${isCollapsed ? "justify-center" : ""} ${
                      item.path
                        ? isActive
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-100"
                        : "text-slate-400 cursor-default"
                    }`}
                    title={isCollapsed ? item.name : ""}
                  >
                    <item.icon size={18} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            {!isCollapsed && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Network</div>}
            <div className="space-y-1">
              {networkItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.path)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${isCollapsed ? "justify-center" : ""} ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                    title={isCollapsed ? item.name : ""}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon size={18} />
                      {!isCollapsed && <span>{item.name}</span>}
                    </span>
                    {item.badge && !isCollapsed && (
                      <span className="h-5 min-w-[20px] rounded-full bg-blue-600 text-white text-xs flex items-center justify-center px-1">
                        {item.badge}
                      </span>
                    )}
                    {item.badge && isCollapsed && (
                      <span className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            {!isCollapsed && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Communication</div>}
            <div className="space-y-1">
              {communicationItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.path)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all relative ${isCollapsed ? "justify-center" : ""} ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                    title={isCollapsed ? item.name : ""}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon size={18} />
                      {!isCollapsed && <span>{item.name}</span>}
                    </span>
                    {item.badge && !isCollapsed && (
                      <span className="h-5 min-w-[20px] rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-1">
                        {item.badge}
                      </span>
                    )}
                    {item.badge && isCollapsed && (
                      <span className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="px-4 py-4 border-t border-slate-200">
          <div className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors ${isCollapsed ? "justify-center" : ""}`}>
            <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {userName.split(" ").map((part: string) => part[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-700 truncate">{userName}</div>
                <div className="text-xs text-slate-400 truncate">{userEmail}</div>
              </div>
            )}
            {!isCollapsed && (
              <button onClick={() => router.push("/college/settings")} className="text-slate-400 hover:text-slate-600">
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
