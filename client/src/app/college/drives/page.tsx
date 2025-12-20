"use client";
import React, { useState, useEffect } from "react";
import CollegeLayout from "../../../components/CollegeLayout";
import { MapPin, Clock, Users, ChevronRight } from "lucide-react";
import api from "@/lib/api";

export default function PlacementCalendar() {
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH REAL DRIVES
  useEffect(() => {
    const fetchDrives = async () => {
        try {
            const storedUser = localStorage.getItem("user");
            if(!storedUser) return;
            const user = JSON.parse(storedUser);
            // If I am admin, use my ID. If staff, use my collegeId.
            const collegeId = user.role === 'college' ? user._id : user.collegeId;

            // We reuse the same API because it fetches based on collegeId
            const { data } = await api.get(`/api/jobs/feed/${collegeId}`);
            setDrives(data);
        } catch (error) {
            console.error("Error loading drives");
        } finally {
            setLoading(false);
        }
    };
    fetchDrives();
  }, []);

  return (
    <CollegeLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Placement Calendar</h1>
                <p className="text-gray-500">Upcoming recruitment drives and interviews.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT: UPCOMING LIST */}
            <div className="lg:col-span-2 space-y-4">
                {loading ? <p>Loading calendar...</p> : drives.length === 0 ? <p>No drives scheduled yet.</p> : (
                    drives.map((drive) => (
                        <div key={drive._id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-300 transition-colors cursor-pointer group">
                            <div className="flex items-start gap-4">
                                <div className="flex flex-col items-center justify-center w-16 h-16 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                                    <span className="text-xs font-bold uppercase">{new Date(drive.deadline).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="text-2xl font-bold">{new Date(drive.deadline).getDate()}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors">{drive.companyId?.name}</h3>
                                    <p className="text-gray-600 font-medium">{drive.title}</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                                        <span className="flex items-center gap-1"><Clock size={12}/> {drive.ctc}</span>
                                        <span className="flex items-center gap-1"><MapPin size={12}/> {drive.location}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                    {drive.status}
                                </span>
                                <ChevronRight className="text-gray-300 group-hover:text-indigo-500"/>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* RIGHT: SUMMARY WIDGET */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 h-fit">
                <h3 className="font-bold text-gray-800 mb-4">Summary</h3>
                <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Drives</span>
                        <span className="font-bold">{drives.length}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-px my-2"></div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 font-semibold mb-1">Latest Drive</p>
                        <p className="text-sm font-bold text-blue-900">{drives[0]?.title || "None"}</p>
                        <p className="text-xs text-blue-700">{drives[0]?.companyId?.name}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </CollegeLayout>
  );
}
