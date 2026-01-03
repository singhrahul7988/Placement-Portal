"use client";
import React, { useState, useEffect } from "react";
import CollegeLayout from "../../../components/CollegeLayout";
import {
  User,
  Save,
  History,
  AlertCircle,
  Users,
  UserPlus,
  ChevronDown
} from "lucide-react";
import api from "@/lib/api";
import TopBarActions from "../../../components/TopBarActions";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [teamFilter, setTeamFilter] = useState("All");
  
  // Profile State
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "", state: "Punjab" });
  
  // Indian States & Union Territories
  const indianStates = [
    "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam",
    "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli",
    "Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
    "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim",
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal"
  ].sort();
  
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
            setFormData({ name: user.name || "", email: user.email || "", phone: user.phone || "", address: "", state: user.state || "Punjab" });
            
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

  const filteredTeam = team.filter((member) => {
    if (teamFilter === "All") return true;
    if (teamFilter === "Active") return !member.isFirstLogin;
    return member.isFirstLogin;
  });

  return (
    <CollegeLayout>
      <div className="px-8 py-6">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-500">Manage account preferences and team access.</p>
          </div>
          <TopBarActions settingsPath="/college/settings" />
        </header>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              activeTab === "profile" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            <User size={16} className="inline-block mr-2" /> Profile
          </button>
          <button
            onClick={() => setActiveTab("team")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              activeTab === "team" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            <Users size={16} className="inline-block mr-2" /> Team Members
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              activeTab === "audit" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            <History size={16} className="inline-block mr-2" /> Audit Logs
          </button>
        </div>

        {/* --- PROFILE TAB --- */}
        {activeTab === "profile" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 max-w-3xl shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">College Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">College Name</label>
                <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Official Email</label>
                <input readOnly value={formData.email} className="w-full p-3 border border-slate-200 rounded-lg bg-slate-100 text-slate-400"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Contact Phone</label>
                <input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50"/>
              </div>
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-500 mb-2">State</label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 appearance-none pr-10"
                >
                  {indianStates.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 bottom-3 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>
            <button onClick={handleSaveProfile} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700">
              <Save size={16}/> Save Changes
            </button>
          </div>
        )}

        {/* --- TEAM TAB (NEW) --- */}
        {activeTab === "team" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 h-fit shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2"><UserPlus size={18} className="text-blue-600"/> Add Staff Member</h3>
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Staff Name</label>
                  <input required placeholder="e.g. Dr. Amit Verma" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg mt-1 bg-slate-50"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Staff Email</label>
                  <input required type="email" placeholder="amit@college.edu" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg mt-1 bg-slate-50"/>
                </div>
                <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-100">
                  User will be given access to this dashboard.
                  <div className="font-semibold mt-1">Default Password: staff123</div>
                </div>
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Create Staff Account
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-800">Current Team</h3>
                <div className="relative">
                  <select
                    value={teamFilter}
                    onChange={(event) => setTeamFilter(event.target.value)}
                    className="appearance-none text-xs text-slate-500 border border-slate-200 rounded-lg px-2 py-1 pr-6 bg-white"
                  >
                    <option value="All">All</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                  </select>
                  <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1.5 text-slate-400"/>
                </div>
              </div>
              <div className="space-y-3">
                {filteredTeam.length === 0 && <p className="text-slate-400 text-sm italic">No staff members found.</p>}
                {filteredTeam.map((member) => (
                  <div key={member._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">
                        {member.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-medium">Active</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- AUDIT TAB --- */}
        {activeTab === "audit" && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-sm text-slate-600">
              <AlertCircle size={16}/> These logs are view-only for security purposes.
            </div>
            <table className="w-full text-left">
              <thead className="bg-white text-slate-400 text-xs uppercase font-bold border-b border-slate-200">
                <tr><th className="p-4">Action</th><th className="p-4">Target</th><th className="p-4">User</th><th className="p-4">Time</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-semibold text-slate-800">{log.action}</td>
                    <td className="p-4 text-blue-600">{log.target}</td>
                    <td className="p-4 text-slate-500">{log.user}</td>
                    <td className="p-4 text-slate-400">{log.time}</td>
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
