"use client";
import React, { useState, useEffect } from "react";
import CompanyLayout from "../../../components/CompanyLayout";
import { Users, Briefcase, FileCheck, TrendingUp, ChevronRight, Calendar, PlusCircle } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function CompanyDashboard() {
  const router = useRouter();
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Recruiter");

  // 1. FETCH REAL JOBS
  useEffect(() => {
    const fetchDrives = async () => {
        const storedUser = localStorage.getItem("user");
        if(!storedUser) return;
        const user = JSON.parse(storedUser);
        setUserName(user.name);

        try {
            // Fetch jobs posted by THIS company
            const { data } = await api.get(`/api/jobs/company/${user._id}`);
            setDrives(data);
        } catch (error) {
            console.error("Failed to load drives");
        } finally {
            setLoading(false);
        }
    };
    fetchDrives();
  }, []);

  // Calculate Real Stats
  const activeCount = drives.filter(d => d.status === 'Open').length;

  return (
    <CompanyLayout>
      <div className="p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Hello, {userName}!</h1>
            <p className="text-gray-500">Here is an overview of your recruitment drives.</p>
          </div>
          <button 
            onClick={() => router.push('/company/create-drive')}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 flex items-center gap-2"
          >
            <PlusCircle size={20}/> Create New Drive
          </button>
        </header>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Active Drives" value={activeCount} icon={Briefcase} color="blue" />
          <StatCard title="Total Jobs Posted" value={drives.length} icon={TrendingUp} color="purple" />
          {/* These are placeholders until we build the Applicants module */}
          <StatCard title="Total Applicants" value="0" icon={Users} color="orange" />
          <StatCard title="Shortlisted" value="0" icon={FileCheck} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT: DRIVES LIST (REAL DATA) */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">Your Placement Drives</h3>
                </div>
                
                <div className="divide-y divide-gray-100">
                    {loading ? (
                        <p className="p-6 text-center text-gray-500">Loading drives...</p>
                    ) : drives.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-500 mb-4">You haven't posted any jobs yet.</p>
                            <button onClick={() => router.push('/company/create-drive')} className="text-blue-600 font-bold hover:underline">Create your first drive</button>
                        </div>
                    ) : (
                        drives.map((drive) => (
                        <div key={drive._id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600 text-lg uppercase">
                                    {drive.title[0]}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{drive.title}</h4>
                                    <p className="text-sm text-gray-500">
                                        {drive.collegeId?.name || "Unknown College"} - Deadline: {new Date(drive.deadline).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    drive.status === "Open" ? "bg-green-100 text-green-700" :
                                    drive.status === "Interviewing" ? "bg-orange-100 text-orange-700" :
                                    "bg-gray-100 text-gray-700"
                                }`}>
                                    {drive.status}
                                </span>
                                <ChevronRight className="text-gray-300 group-hover:text-blue-600"/>
                            </div>
                        </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT: CALENDAR WIDGET */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
                <h3 className="font-bold text-lg text-gray-800 mb-4">Upcoming Schedule</h3>
                {drives.length > 0 ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-blue-500 uppercase">Next Deadline</span>
                            </div>
                            <h4 className="font-bold text-blue-900">{drives[0].title}</h4>
                            <p className="text-sm text-blue-600">{new Date(drives[0].deadline).toLocaleDateString()}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No upcoming events.</p>
                )}
            </div>

        </div>
      </div>
    </CompanyLayout>
  );
}

// Simple Helper for Stats
function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
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
