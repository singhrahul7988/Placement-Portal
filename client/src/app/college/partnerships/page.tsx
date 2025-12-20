"use client";
import React, { useState, useEffect } from "react";
import CollegeLayout from "../../../components/CollegeLayout";
import { Building2, CheckCircle, XCircle, Clock, Search, MoreVertical } from "lucide-react";
import api from "@/lib/api";

export default function CompanyRequests() {
  const [activeTab, setActiveTab] = useState("pending");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. FETCH REQUESTS
  const fetchRequests = async () => {
    try {
        const storedUser = localStorage.getItem("user");
        if(!storedUser) return;
        const user = JSON.parse(storedUser);
        const collegeId = user.role === "college" ? user._id : user.collegeId;

        const { data } = await api.get(`/api/network/requests/${collegeId}`);
        setRequests(data);
        setLoading(false);
    } catch (error) {
        console.error("Error fetching network");
        setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  // 2. HANDLE ACCEPT / REJECT
  const handleRespond = async (id: string, status: 'Active' | 'Rejected') => {
    try {
        await api.put("/api/network/respond", { partnershipId: id, status });
        alert(`Request ${status}!`);
        fetchRequests(); // Refresh list
    } catch (error) {
        alert("Action failed");
    }
  };

  // Filter lists
  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const activePartners = requests.filter(r => r.status === 'Active');

  return (
    <CollegeLayout>
      <div className="p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Partnerships</h1>
          <p className="text-gray-500">Manage company connections and approvals.</p>
        </header>

        {/* TABS */}
        <div className="flex gap-6 border-b border-gray-200 mb-8">
          <button onClick={() => setActiveTab("pending")} className={`pb-3 font-medium flex items-center gap-2 ${activeTab === "pending" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"}`}>
            <Clock size={20}/> Pending Requests ({pendingRequests.length})
          </button>
          <button onClick={() => setActiveTab("active")} className={`pb-3 font-medium flex items-center gap-2 ${activeTab === "active" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"}`}>
            <Building2 size={20}/> Active Partners ({activePartners.length})
          </button>
        </div>

        {/* LIST VIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(activeTab === "pending" ? pendingRequests : activePartners).map((req) => {
             // Determine which user is the "Other" party (The Company)
             const company = req.requesterId.role === 'company' ? req.requesterId : req.recipientId;
             
             return (
              <div key={req._id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl">
                    {company.name[0]}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">{company.name}</h3>
                            <p className="text-sm text-gray-500">{company.email}</p>
                            <p className="text-xs text-gray-400 mt-1">Sent: {new Date(req.createdAt).toLocaleDateString()}</p>
                        </div>
                        {activeTab === "active" && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Connected</span>}
                    </div>

                    {/* ACTIONS FOR PENDING */}
                    {activeTab === "pending" && (
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => handleRespond(req._id, 'Active')} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                                Accept
                            </button>
                            <button onClick={() => handleRespond(req._id, 'Rejected')} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                                Decline
                            </button>
                        </div>
                    )}
                </div>
              </div>
             );
          })}

          {/* EMPTY STATE */}
          {(activeTab === "pending" ? pendingRequests : activePartners).length === 0 && (
            <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-400">No {activeTab} partnerships found.</p>
            </div>
          )}
        </div>
      </div>
    </CollegeLayout>
  );
}
