"use client";
import React, { useState, useEffect } from "react";
import StudentLayout from "../../../components/StudentLayout";
import { MapPin, DollarSign, Calendar, CheckCircle, XCircle, Building2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function JobFeed() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugMsg, setDebugMsg] = useState(""); // To show errors on screen
  const [studentProfile, setStudentProfile] = useState({ cgpa: 0, branch: "" });

  // 1. FETCH REAL JOBS
  useEffect(() => {
    const fetchJobs = async () => {
        const storedUser = localStorage.getItem("user");
        if(!storedUser) {
            setDebugMsg("No user found in storage. Please logout and login.");
            setLoading(false);
            return;
        }
        
        const user = JSON.parse(storedUser);
        
        // DEBUG LOGGING
        console.log("--- DEBUGGING JOB FEED ---");
        console.log("Logged in User:", user);
        console.log("Student College ID:", user.collegeId);

        if (!user.collegeId) {
            setDebugMsg("Error: Your account is not linked to a College. Please ask Admin to re-add you.");
            setLoading(false);
            return;
        }

        // Save profile for eligibility check
        setStudentProfile({ 
            cgpa: parseFloat(user.cgpa || "0"), 
            branch: user.branch || "" 
        });

        try {
            // Fetch jobs specifically for this student's college
            const url = `/api/jobs/feed/${user.collegeId}`;
            console.log("Fetching from URL:", url);
            
            const { data } = await api.get(url);
            console.log("Jobs Received:", data);
            
            setJobs(data);
        } catch (error: any) {
            console.error("Failed to load jobs", error);
            setDebugMsg("API Error: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };
    fetchJobs();
  }, []);

  return (
    <StudentLayout>
      <div className="p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Job Feed</h1>
          <p className="text-gray-500">
            Based on your Profile (CGPA: <span className="font-bold text-black">{studentProfile.cgpa}</span>)
          </p>
        </header>

        {/* DEBUG MESSAGE BOX */}
        {debugMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                <AlertTriangle size={20}/> 
                <span>{debugMsg}</span>
            </div>
        )}

        {loading ? (
            <p className="text-gray-500">Loading opportunities...</p>
        ) : jobs.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500 mb-2">No jobs posted for your college yet.</p>
                <p className="text-xs text-gray-400">Debug Hint: Check if the Company posted to the correct College ID.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => {
                // 2. REAL ELIGIBILITY LOGIC
                const isCgpaOk = studentProfile.cgpa >= (job.criteria?.minCgpa || 0);
                const isBranchOk = !job.criteria?.branches?.length || job.criteria.branches.includes(studentProfile.branch);
                const isEligible = isCgpaOk; // Add && isBranchOk if you want strict checking

                return (
                <div key={job._id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 relative">
                    
                    <div className={`absolute top-4 right-4 flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${
                    isEligible ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                    {isEligible ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                    {isEligible ? "Eligible" : `Requires ${job.criteria?.minCgpa}+`}
                    </div>

                    <div className="w-14 h-14 rounded-lg flex items-center justify-center mb-4 text-xl font-bold bg-blue-50 text-blue-600">
                    {job.companyId?.name?.[0] || "C"}
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 mb-1">{job.title}</h3>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                    <Building2 size={16} /> {job.companyId?.name || "Company"}
                    </div>

                    <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={16} className="text-gray-400" /> {job.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign size={16} className="text-gray-400" /> {job.ctc}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} className="text-gray-400" /> 
                        {new Date(job.deadline).toLocaleDateString()}
                    </div>
                    </div>

                    <button 
                    disabled={!isEligible}
                    onClick={() => router.push(`/student/jobs/${job._id}`)}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                        isEligible 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                    >
                    {isEligible ? "View Details & Apply" : "Not Eligible"}
                    </button>
                </div>
                );
            })}
            </div>
        )}
      </div>
    </StudentLayout>
  );
}
