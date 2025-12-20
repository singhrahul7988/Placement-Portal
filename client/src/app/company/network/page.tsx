"use client";
import React, { useState, useEffect } from "react";
import CompanyLayout from "../../../components/CompanyLayout";
import { Search, MapPin, School, UserPlus, CheckCircle, Clock } from "lucide-react";
import api from "@/lib/api";

export default function CompanyNetwork() {
  const [colleges, setColleges] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. FETCH DATA (All Colleges + My Existing Requests)
  const loadData = async () => {
    try {
        const storedUser = localStorage.getItem("user");
        if(!storedUser) return;
        const userId = JSON.parse(storedUser)._id;

        // Parallel API calls for speed
        const [collegesRes, requestsRes] = await Promise.all([
            api.get("/api/network/search-colleges"),
            api.get(`/api/network/requests/${userId}`)
        ]);

        setColleges(collegesRes.data);
        setMyRequests(requestsRes.data);
        setLoading(false);
    } catch (error) {
        console.error("Failed to load network data");
        setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // 2. SEND CONNECTION REQUEST
  const handleConnect = async (collegeId: string) => {
    try {
        const storedUser = localStorage.getItem("user");
        if(!storedUser) return;
        const requesterId = JSON.parse(storedUser)._id;

        await api.post("/api/network/connect", {
            requesterId,
            recipientId: collegeId
        });
        
        alert("Request Sent Successfully!");
        loadData(); // Refresh to update button state
    } catch (error: any) {
        alert(error.response?.data?.message || "Failed to connect");
    }
  };

  // Helper to check status of a specific college
  const getStatus = (collegeId: string) => {
    const req = myRequests.find(r => r.recipientId._id === collegeId || r.requesterId._id === collegeId);
    return req ? req.status : null; // 'Pending', 'Active', or null
  };

  const filteredColleges = colleges.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <CompanyLayout>
      <div className="p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Campus Network</h1>
          <p className="text-gray-500">Find and connect with top universities for recruitment.</p>
        </header>

        {/* SEARCH BAR */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-8 flex items-center gap-3">
            <Search className="text-gray-400" size={20} />
            <input 
                placeholder="Search by college name..." 
                className="flex-1 outline-none text-gray-700"
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {/* COLLEGE GRID */}
        {loading ? (
            <p className="text-center text-gray-500">Loading network...</p>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredColleges.map((college) => {
                    const status = getStatus(college._id);
                    
                    return (
                        <div key={college._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                            <div className="h-24 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center justify-center">
                                <School className="text-slate-600 opacity-20" size={64}/>
                            </div>
                            <div className="p-6 relative">
                                <div className="absolute -top-8 left-6 w-16 h-16 bg-white rounded-xl shadow-md flex items-center justify-center text-2xl font-bold text-slate-800 border-4 border-white">
                                    {college.name[0]}
                                </div>
                                <div className="mt-8">
                                    <h3 className="font-bold text-gray-800 text-lg truncate">{college.name}</h3>
                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                        <MapPin size={14}/> India
                                    </p>
                                </div>
                                <div className="mt-6">
                                    {status === 'Active' ? (
                                        <button disabled className="w-full py-2 bg-green-50 text-green-700 font-bold rounded-lg flex items-center justify-center gap-2 cursor-default border border-green-200">
                                            <CheckCircle size={18}/> Partnered
                                        </button>
                                    ) : status === 'Pending' ? (
                                        <button disabled className="w-full py-2 bg-orange-50 text-orange-600 font-bold rounded-lg flex items-center justify-center gap-2 cursor-default border border-orange-200">
                                            <Clock size={18}/> Request Sent
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleConnect(college._id)}
                                            className="w-full py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <UserPlus size={18}/> Connect
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    </CompanyLayout>
  );
}
