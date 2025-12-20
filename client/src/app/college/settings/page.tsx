"use client";
import React, { useState, useEffect } from "react";
import CollegeLayout from "../../../components/CollegeLayout";
import { User, Lock, Save, History, AlertCircle, Users, UserPlus, Trash2 } from "lucide-react";
import api from "@/lib/api";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile State
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "" });
  
  // Team State
  const [team, setTeam] = useState<any[]>([]);
  const [newStaff, setNewStaff] = useState({ name: "", email: "" });

  // Audit Logs (Mock Data for MVP)
  const logs = [
    { id: 1, action: "Approved Connection", target: "Google", user: "Admin", time: "2 hours ago" },
    { id: 2, action: "Added Student", target: "Rahul Sharma", user: "Staff", time: "5 hours ago" },
    { id: 3, action: "Updated Drive", target: "Microsoft Round 1", user: "Admin", time: "1 day ago" },
  ];

  // Load Initial Data
  useEffect(() => {
    const loadData = async () => {
        const storedUser = localStorage.getItem("user");
        if(storedUser) {
            const user = JSON.parse(storedUser);
            setFormData({ name: user.name || "", email: user.email || "", phone: user.phone || "", address: "" });
            
            // Fetch team only if user is college admin or member
            if(user.role === 'college' || user.role === 'college_member') {
                // Determine the main college ID (if I am staff, use my collegeId; if I am admin, use my _id)
                const collegeId = user.role === 'college' ? user._id : user.collegeId;
                try {
                    const res = await api.get(`/api/auth/team/${collegeId}`);
                    setTeam(res.data);
                } catch(e) {
                    console.error("Failed to load team");
                }
            }
        }
    };
    loadData();
  }, []);

  const handleSaveProfile = async () => {
    try {
        await api.put("/api/auth/update-profile", formData);
        
        // Update local storage so changes persist on refresh
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = { ...currentUser, ...formData };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        alert("Settings Saved!");
    } catch(err) { 
        alert("Failed to save profile."); 
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const storedUser = localStorage.getItem("user");
        if(!storedUser) return;
        const user = JSON.parse(storedUser);
        
        // Ensure we associate staff with the correct college ID
        const collegeId = user.role === 'college' ? user._id : user.collegeId;

        const res = await api.post("/api/auth/add-staff", { ...newStaff, collegeId });
        
        alert("Staff Added! Default Password: staff123");
        setTeam([...team, res.data.user]); // Update list immediately
        setNewStaff({ name: "", email: "" }); // Clear form
    } catch(err: any) { 
        alert(err.response?.data?.message || "Failed to add staff"); 
    }
  };

  return (
    <CollegeLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>

        <div className="flex gap-6 border-b border-gray-200 mb-8">
            <button onClick={() => setActiveTab("profile")} className={`pb-3 font-medium flex items-center gap-2 ${activeTab === "profile" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"}`}>
                <User size={18}/> Profile
            </button>
            <button onClick={() => setActiveTab("team")} className={`pb-3 font-medium flex items-center gap-2 ${activeTab === "team" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"}`}>
                <Users size={18}/> Team Members
            </button>
            <button onClick={() => setActiveTab("audit")} className={`pb-3 font-medium flex items-center gap-2 ${activeTab === "audit" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"}`}>
                <History size={18}/> Audit Logs
            </button>
        </div>

        {/* --- PROFILE TAB --- */}
        {activeTab === "profile" && (
            <div className="bg-white p-8 rounded-xl border border-gray-200 max-w-2xl">
                <h3 className="font-bold text-lg mb-6">College Information</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">College Name</label>
                        <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-lg"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Official Email</label>
                        <input readOnly value={formData.email} className="w-full p-3 border rounded-lg bg-gray-100 cursor-not-allowed"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                        <input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border rounded-lg"/>
                    </div>
                    <button onClick={handleSaveProfile} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700">
                        <Save size={18}/> Save Changes
                    </button>
                </div>
            </div>
        )}

        {/* --- TEAM TAB (NEW) --- */}
        {activeTab === "team" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Add New Form */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 h-fit shadow-sm">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><UserPlus size={20} className="text-indigo-600"/> Add Staff Member</h3>
                    <form onSubmit={handleAddStaff} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Staff Name</label>
                            <input required placeholder="e.g. Dr. Amit Verma" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full p-3 border rounded-lg mt-1"/>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Staff Email (Login ID)</label>
                            <input required type="email" placeholder="amit@college.edu" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full p-3 border rounded-lg mt-1"/>
                        </div>
                        
                        <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-100">
                            User will be given access to this dashboard. <br/>
                            <strong>Default Password:</strong> staff123
                        </div>
                        
                        <button className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors">
                            Create Staff Account
                        </button>
                    </form>
                </div>

                {/* Team List */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-lg mb-4 text-gray-800">Current Team</h3>
                    <div className="space-y-3">
                        {team.length === 0 && <p className="text-gray-400 text-sm italic">No additional staff members added yet.</p>}
                        
                        {team.map((member) => (
                            <div key={member._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">
                                        {member.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{member.name}</p>
                                        <p className="text-xs text-gray-500">{member.email}</p>
                                    </div>
                                </div>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">Active</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* --- AUDIT TAB --- */}
        {activeTab === "audit" && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2 text-sm text-gray-600">
                    <AlertCircle size={16}/> These logs are view-only for security purposes.
                </div>
                <table className="w-full text-left">
                    <thead className="bg-white text-gray-500 text-xs uppercase font-bold border-b">
                        <tr><th className="p-4">Action</th><th className="p-4">Target</th><th className="p-4">User</th><th className="p-4">Time</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-semibold text-gray-800">{log.action}</td>
                                <td className="p-4 text-indigo-600">{log.target}</td>
                                <td className="p-4 text-gray-500">{log.user}</td>
                                <td className="p-4 text-gray-400">{log.time}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </CollegeLayout>
  );
}
