"use client";
import React from "react";
// 1. IMPORT THE NEW LAYOUT
import CollegeLayout from "../../../components/CollegeLayout";
import { Users, Building2, CheckCircle, TrendingUp, Search } from "lucide-react";

export default function CollegeDashboard() {
  // MOCK DATA: In Phase 4, we will fetch this from the backend
  const stats = [
    { title: "Total Students", value: "1,200", icon: Users, color: "blue" },
    { title: "Placed", value: "850", icon: CheckCircle, color: "green" },
    { title: "Companies", value: "45", icon: Building2, color: "purple" },
    { title: "Avg Package", value: "Rs 12.5 LPA", icon: TrendingUp, color: "orange" },
  ];

  // 2. USE THE LAYOUT WRAPPER
  return (
    <CollegeLayout>
      <div className="p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Placement Cell Overview</h1>
            <p className="text-gray-500">Track your students and recruitment drives.</p>
          </div>
          <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
            <Search size={20} className="text-gray-400" />
            <input placeholder="Search..." className="outline-none text-sm w-48" />
          </div>
        </header>

        {/* TOP STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatCard 
                key={index}
                title={stat.title} 
                value={stat.value} 
                icon={stat.icon} 
                color={stat.color} 
            />
          ))}
        </div>

        {/* RECENT ACTIVITY PLACEHOLDER */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-lg text-gray-800 mb-4">Upcoming Drives</h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-white shadow-sm flex items-center justify-center rounded font-bold text-blue-600">G</div>
                        <div>
                            <h4 className="font-bold text-sm text-gray-800">Google India</h4>
                            <p className="text-xs text-gray-500">Dec 15 - Software Engineer</p>
                        </div>
                        <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Scheduled</span>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-white shadow-sm flex items-center justify-center rounded font-bold text-orange-600">A</div>
                        <div>
                            <h4 className="font-bold text-sm text-gray-800">Amazon</h4>
                            <p className="text-xs text-gray-500">Dec 18 - SDE-1</p>
                        </div>
                        <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Pending</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-lg text-gray-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                    <button className="p-4 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex flex-col items-center justify-center gap-2">
                        <Building2 size={24}/>
                        <span className="text-sm font-medium">Invite Company</span>
                    </button>
                    <button className="p-4 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-500 hover:text-green-600 transition-colors flex flex-col items-center justify-center gap-2">
                        <TrendingUp size={24}/>
                        <span className="text-sm font-medium">Download Report</span>
                    </button>
                </div>
            </div>
        </div>

      </div>
    </CollegeLayout>
  );
}

// Simple Helper Component
function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`p-4 rounded-lg ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <h4 className="text-2xl font-bold text-gray-800">{value}</h4>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </div>
  );
}
