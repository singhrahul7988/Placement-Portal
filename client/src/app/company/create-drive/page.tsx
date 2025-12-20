"use client";
import React, { useState, useEffect } from "react";
import CompanyLayout from "../../../components/CompanyLayout";
import { Briefcase, DollarSign, MapPin, CheckCircle, Layers } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function CreateDrive() {
  const router = useRouter();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    collegeId: "",
    ctc: "",
    location: "",
    deadline: "",
    minCgpa: "0",
    description: "",
    rounds: "Aptitude, Technical, HR"
  });

  const [branches, setBranches] = useState({
    CSE: true, ECE: true, ME: false, CE: false
  });

  // 1. Fetch Connected Colleges (Partners)
  useEffect(() => {
    const fetchPartners = async () => {
        const storedUser = localStorage.getItem("user");
        if(!storedUser) return;
        const userId = JSON.parse(storedUser)._id;

        try {
            const { data } = await api.get(`/api/network/requests/${userId}`);
            // Filter only ACTIVE partnerships and get the OTHER party (College)
            const active = data
                .filter((p: any) => p.status === 'Active')
                .map((p: any) => p.recipientId._id === userId ? p.requesterId : p.recipientId);
            
            setPartners(active);
        } catch(e) { console.error("Error loading partners"); }
    };
    fetchPartners();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const storedUser = localStorage.getItem("user");
        if(!storedUser) return;
        const companyId = JSON.parse(storedUser)._id;

        // Get selected branches
        const selectedBranches = Object.keys(branches).filter(k => branches[k as keyof typeof branches]);

        await api.post("/api/jobs/create", {
            ...formData,
            companyId,
            rounds: formData.rounds.split(",").map(r => r.trim()), 
            branches: selectedBranches
        });

        alert("Job Drive Created Successfully!");
        router.push("/company/dashboard");
    } catch (error: any) {
        alert("Error: " + (error.response?.data?.message || error.message));
    } finally {
        setLoading(false);
    }
  };

  return (
    <CompanyLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Create New Drive</h1>

        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* SECTION 1: BASIC INFO */}
                <div>
                    <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
                        <Briefcase size={20}/> Job Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Job Title</label>
                            <input required placeholder="e.g. SDE - 1" className="w-full p-3 border rounded-lg outline-none focus:border-blue-500"
                                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Target College</label>
                            <select required className="w-full p-3 border rounded-lg outline-none focus:border-blue-500 bg-white"
                                value={formData.collegeId} onChange={e => setFormData({...formData, collegeId: e.target.value})}>
                                <option value="">Select a College</option>
                                {partners.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                            {partners.length === 0 && <p className="text-xs text-red-500 mt-1">No partners found. Connect in 'Network' first.</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">CTC / Package</label>
                            <div className="relative">
                                <DollarSign size={18} className="absolute left-3 top-3.5 text-gray-400"/>
                                <input required placeholder="e.g. 12 LPA" className="w-full pl-10 p-3 border rounded-lg outline-none focus:border-blue-500"
                                    value={formData.ctc} onChange={e => setFormData({...formData, ctc: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Job Location</label>
                            <div className="relative">
                                <MapPin size={18} className="absolute left-3 top-3.5 text-gray-400"/>
                                <input required placeholder="e.g. Bangalore / Remote" className="w-full pl-10 p-3 border rounded-lg outline-none focus:border-blue-500"
                                    value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Job Description</label>
                            <textarea required rows={4} placeholder="Role responsibilities..." className="w-full p-3 border rounded-lg outline-none focus:border-blue-500"
                                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-gray-100"></div>

                {/* SECTION 2: CRITERIA */}
                <div>
                    <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
                        <CheckCircle size={20}/> Eligibility Criteria
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Minimum CGPA</label>
                            <input type="number" step="0.1" required className="w-full p-3 border rounded-lg outline-none focus:border-blue-500"
                                value={formData.minCgpa} onChange={e => setFormData({...formData, minCgpa: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Deadline</label>
                            <input type="date" required className="w-full p-3 border rounded-lg outline-none focus:border-blue-500"
                                value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-600 mb-2">Eligible Branches</label>
                            <div className="flex gap-4 flex-wrap">
                                {Object.keys(branches).map((branch) => (
                                    <label key={branch} className={`cursor-pointer px-4 py-2 rounded-lg border transition-colors ${branches[branch as keyof typeof branches] ? "bg-slate-900 text-white border-slate-900" : "bg-white text-gray-600 border-gray-300"}`}>
                                        <input type="checkbox" className="hidden" 
                                            checked={branches[branch as keyof typeof branches]}
                                            onChange={() => setBranches({...branches, [branch]: !branches[branch as keyof typeof branches]})}
                                        />
                                        {branch}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-gray-100"></div>

                {/* SECTION 3: HIRING PROCESS */}
                <div>
                    <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
                        <Layers size={20}/> Hiring Flow
                    </h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Interview Rounds (Comma Separated)</label>
                        <input required placeholder="e.g. Online Test, Technical 1, HR" className="w-full p-3 border rounded-lg outline-none focus:border-blue-500"
                            value={formData.rounds} onChange={e => setFormData({...formData, rounds: e.target.value})} />
                    </div>
                </div>

                <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-200">
                    {loading ? "Publishing Drive..." : "Publish Drive"}
                </button>

            </form>
        </div>
      </div>
    </CompanyLayout>
  );
}
