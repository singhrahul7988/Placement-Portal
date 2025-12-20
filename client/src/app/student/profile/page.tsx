"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
// 1. IMPORT THE NEW LAYOUT
import StudentLayout from "../../../components/StudentLayout";
import { User, FileText, Upload, CheckCircle, AlertCircle, Loader2, Trash2, X, Save, Mail, Phone, BookOpen, Hash, PlayCircle, Briefcase, Award, Plus, Calendar, Paperclip } from "lucide-react";
import api from "@/lib/api";
import { useSearchParams } from "next/navigation";

// --- MAIN CONTENT COMPONENT ---
function ProfileContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("details");

  // LISTENER: Switch tabs if URL changes (e.g. clicked from Sidebar)
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "details" || tab === "portfolio" || tab === "resumes") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // --- 1. PERSONAL DETAILS STATE ---
  const [formData, setFormData] = useState({
    name: "",      
    email: "",
    phone: "",
    branch: "",
    cgpa: "",
    skills: ""
  });

  // LOAD DATA
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setFormData({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          branch: user.branch || "",
          cgpa: user.cgpa !== undefined && user.cgpa !== null ? String(user.cgpa) : "",
          skills: user.skills || ""
        });
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }
  }, []); 

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveChanges = async () => {
    try {
        const res = await api.put("/api/auth/update-profile", formData);
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = { ...currentUser, ...res.data };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        alert("Profile Updated Successfully!");
    } catch (error) {
        alert("Failed to update profile.");
    }
  };

  // --- 2. RESUME VAULT STATE ---
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [selectedResumeFile, setSelectedResumeFile] = useState<File | null>(null);
  const [resumes, setResumes] = useState([
    { id: 1, name: "Software_Engineer_Resume.pdf", score: 85, date: "2024-10-12", isAnalyzing: false },
  ]);
  const MAX_RESUMES = 2;

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelectedResumeFile(e.target.files[0]);
  };

  const handleUploadResume = () => {
    if (!selectedResumeFile || resumes.length >= MAX_RESUMES) return;
    const newResume = { 
        id: Date.now(), name: selectedResumeFile.name, score: null as number | null, date: new Date().toISOString().split('T')[0], isAnalyzing: false 
    };
    setResumes([newResume, ...resumes]);
    setSelectedResumeFile(null);
  };

  const handleAnalyzeResume = (id: number) => {
    setResumes(resumes.map(r => r.id === id ? { ...r, isAnalyzing: true } : r));
    setTimeout(() => {
        const newScore = Math.floor(Math.random() * (95 - 60) + 60);
        setResumes(current => current.map(r => r.id === id ? { ...r, score: newScore, isAnalyzing: false } : r));
    }, 2000);
  };

  const handleDeleteResume = (id: number) => setResumes(resumes.filter(r => r.id !== id));

  // --- 3. PORTFOLIO STATE ---
  const internFileInputRef = useRef<HTMLInputElement>(null);
  const [internships, setInternships] = useState([
    { id: 1, role: "Frontend Intern", company: "TechCorp", duration: "3 Months", fileName: "offer_letter.pdf" }
  ]);
  const [newInternship, setNewInternship] = useState({ role: "", company: "", duration: "" });
  const [selectedInternFile, setSelectedInternFile] = useState<File | null>(null);
  const [showInternshipForm, setShowInternshipForm] = useState(false);

  const handleInternFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelectedInternFile(e.target.files[0]);
  };

  const addInternship = () => {
    if(!newInternship.role || !newInternship.company) return;
    setInternships([...internships, { 
        id: Date.now(), ...newInternship, fileName: selectedInternFile ? selectedInternFile.name : "No Proof Attached" 
    }]);
    setNewInternship({ role: "", company: "", duration: "" });
    setSelectedInternFile(null);
    setShowInternshipForm(false);
  };

  const certInputRef = useRef<HTMLInputElement>(null);
  const [certificates, setCertificates] = useState([
    { id: 1, name: "AWS Cloud Practitioner", issuer: "Amazon", date: "2024-05-15", fileName: "aws_cert.pdf" }
  ]);
  const [newCert, setNewCert] = useState({ name: "", issuer: "" });
  const [selectedCertFile, setSelectedCertFile] = useState<File | null>(null);
  const [showCertForm, setShowCertForm] = useState(false);

  const handleCertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelectedCertFile(e.target.files[0]);
  };

  const addCertificate = () => {
    if(!newCert.name || !selectedCertFile) return;
    setCertificates([...certificates, { 
      id: Date.now(), name: newCert.name, issuer: newCert.issuer, date: new Date().toISOString().split('T')[0], fileName: selectedCertFile.name
    }]);
    setNewCert({ name: "", issuer: "" });
    setSelectedCertFile(null);
    setShowCertForm(false);
  };

  // --- RENDER CONTENT ---
  // Note: We removed the <main ml-64> tag because StudentLayout handles the margin/spacing now.
  // We replaced it with a simple <div> with padding.
  return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>

        {/* TABS */}
        <div className="flex gap-8 border-b border-gray-200 mb-8">
          <button onClick={() => setActiveTab("details")} className={`pb-3 font-medium flex items-center gap-2 transition-colors ${activeTab === "details" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
            <User size={20}/> Personal Details
          </button>
          <button onClick={() => setActiveTab("portfolio")} className={`pb-3 font-medium flex items-center gap-2 transition-colors ${activeTab === "portfolio" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
            <Briefcase size={20}/> Portfolio
          </button>
          <button onClick={() => setActiveTab("resumes")} className={`pb-3 font-medium flex items-center gap-2 transition-colors ${activeTab === "resumes" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
            <FileText size={20}/> Resume Vault
          </button>
        </div>

        {/* TAB 1: DETAILS (LOCKED) */}
        {activeTab === "details" && (
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><User size={20} className="text-blue-600"/> Basic Information</h3>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full border border-yellow-200 flex items-center gap-1"><AlertCircle size={12}/> Only 'Name' & 'Skills' are editable.</span>
            </div>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><label className="text-sm font-semibold text-gray-600">Full Name</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div className="space-y-2"><label className="text-sm font-semibold text-gray-600 flex items-center gap-1">Email <span className="text-xs text-gray-400 font-normal">(Locked)</span></label><input readOnly type="email" name="email" value={formData.email} className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed outline-none" /></div>
              <div className="space-y-2"><label className="text-sm font-semibold text-gray-600 flex items-center gap-1">Phone <span className="text-xs text-gray-400 font-normal">(Contact Admin)</span></label><input readOnly type="text" name="phone" value={formData.phone} className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed outline-none" /></div>
              <div className="space-y-2"><label className="text-sm font-semibold text-gray-600 flex items-center gap-1">Current CGPA <span className="text-xs text-gray-400 font-normal">(Verified)</span></label><input readOnly type="text" name="cgpa" value={formData.cgpa} className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed outline-none font-bold" /></div>
              <div className="space-y-2 md:col-span-2"><label className="text-sm font-semibold text-gray-600 flex items-center gap-1">Branch / Stream <span className="text-xs text-gray-400 font-normal">(Locked)</span></label><input readOnly type="text" name="branch" value={formData.branch} className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed outline-none" /></div>
              <div className="space-y-2 md:col-span-2"><label className="text-sm font-semibold text-gray-600">Skills (Comma Separated)</label><input type="text" name="skills" value={formData.skills} onChange={handleInputChange} placeholder="React, Java, Python..." className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div className="col-span-2 mt-4"><button type="button" onClick={handleSaveChanges} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"><Save size={18}/> Save Changes</button></div>
            </form>
          </div>
        )}

        {/* TAB 2: PORTFOLIO */}
        {activeTab === "portfolio" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="flex items-center justify-between"><h3 className="font-bold text-xl text-gray-800 flex items-center gap-2"><Briefcase className="text-orange-500" size={24}/> Internships</h3><button onClick={() => setShowInternshipForm(!showInternshipForm)} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg font-medium flex items-center gap-1"><Plus size={16}/> Add New</button></div>
                {showInternshipForm && (
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 space-y-3 animate-in slide-in-from-top-2">
                        <input placeholder="Role (e.g. SDE Intern)" className="w-full p-2 rounded border border-orange-200" value={newInternship.role} onChange={(e) => setNewInternship({...newInternship, role: e.target.value})} />
                        <input placeholder="Company Name" className="w-full p-2 rounded border border-orange-200" value={newInternship.company} onChange={(e) => setNewInternship({...newInternship, company: e.target.value})} />
                        <input placeholder="Duration (e.g. June - Aug 2024)" className="w-full p-2 rounded border border-orange-200" value={newInternship.duration} onChange={(e) => setNewInternship({...newInternship, duration: e.target.value})} />
                        <input type="file" ref={internFileInputRef} onChange={handleInternFileChange} className="hidden" accept=".pdf,.jpg" />
                        <div onClick={() => internFileInputRef.current?.click()} className="border border-dashed border-orange-300 bg-white p-3 rounded text-center cursor-pointer text-sm text-orange-600 flex items-center justify-center gap-2"><Paperclip size={14}/> {selectedInternFile ? selectedInternFile.name : "Attach Internship Certificate"}</div>
                        <button onClick={addInternship} className="w-full bg-orange-500 text-white font-bold py-2 rounded-lg hover:bg-orange-600">Save Experience</button>
                    </div>
                )}
                <div className="space-y-4">{internships.map(intern => ( <div key={intern.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4"><div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><Briefcase size={20} /></div><div className="flex-1"><h4 className="font-bold text-gray-800">{intern.role}</h4><p className="font-medium text-gray-600">{intern.company}</p><p className="text-xs text-gray-400 mt-1">{intern.duration}</p><div className="flex items-center gap-1 mt-2 text-xs text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded"><Paperclip size={10}/> Proof: {intern.fileName}</div></div><button onClick={() => setInternships(internships.filter(i => i.id !== intern.id))} className="ml-auto text-gray-300 hover:text-red-500"><Trash2 size={16}/></button></div> ))}</div>
            </div>
            <div className="space-y-6">
                <div className="flex items-center justify-between"><h3 className="font-bold text-xl text-gray-800 flex items-center gap-2"><Award className="text-purple-500" size={24}/> Certifications</h3><button onClick={() => setShowCertForm(!showCertForm)} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg font-medium flex items-center gap-1"><Plus size={16}/> Upload</button></div>
                {showCertForm && (
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 space-y-3 animate-in slide-in-from-top-2">
                        <input placeholder="Certificate Name (e.g. AWS)" className="w-full p-2 rounded border border-purple-200" value={newCert.name} onChange={(e) => setNewCert({...newCert, name: e.target.value})} />
                        <input placeholder="Issuing Organization" className="w-full p-2 rounded border border-purple-200" value={newCert.issuer} onChange={(e) => setNewCert({...newCert, issuer: e.target.value})} />
                        <input type="file" ref={certInputRef} onChange={handleCertFileChange} className="hidden" accept=".pdf,.jpg,.png" />
                        <div onClick={() => certInputRef.current?.click()} className="border border-dashed border-purple-300 bg-white p-3 rounded text-center cursor-pointer text-sm text-purple-600 flex items-center justify-center gap-2"><Upload size={14}/> {selectedCertFile ? selectedCertFile.name : "Upload File"}</div>
                        <button onClick={addCertificate} className="w-full bg-purple-600 text-white font-bold py-2 rounded-lg hover:bg-purple-700">Save Certificate</button>
                    </div>
                )}
                <div className="space-y-4">{certificates.map(cert => ( <div key={cert.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4"><div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><Award size={20} /></div><div className="flex-1 overflow-hidden"><h4 className="font-bold text-gray-800 truncate">{cert.name}</h4><p className="font-medium text-gray-600">{cert.issuer}</p><div className="flex items-center gap-2 mt-2"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">File: {cert.fileName}</span></div></div><button onClick={() => setCertificates(certificates.filter(c => c.id !== cert.id))} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button></div> ))}</div>
            </div>
          </div>
        )}

        {/* TAB 3: RESUME VAULT */}
        {activeTab === "resumes" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm h-fit">
              <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-gray-800">Upload Resume</h3><span className={`text-xs font-bold px-2 py-1 rounded ${resumes.length >= MAX_RESUMES ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{resumes.length} / {MAX_RESUMES} Used</span></div>
              <input type="file" ref={resumeInputRef} onChange={handleResumeFileChange} className="hidden" accept=".pdf" />
              {!selectedResumeFile ? ( <div onClick={resumes.length < MAX_RESUMES ? () => resumeInputRef.current?.click() : undefined} className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center mb-6 transition-colors ${resumes.length >= MAX_RESUMES ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60" : "border-blue-200 bg-blue-50 cursor-pointer hover:bg-blue-100"}`}><div className="w-16 h-16 bg-white text-blue-600 rounded-full flex items-center justify-center mb-4 shadow-sm"><Upload size={32} /></div><p className="font-semibold text-gray-700">{resumes.length >= MAX_RESUMES ? "Limit Reached" : "Click to Select Resume"}</p></div> ) : ( <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between"><span className="font-medium text-blue-900 truncate max-w-[200px]">{selectedResumeFile.name}</span><button onClick={() => setSelectedResumeFile(null)} className="text-gray-400 hover:text-red-500"><X size={20} /></button></div> )}
              <button onClick={handleUploadResume} disabled={!selectedResumeFile || resumes.length >= MAX_RESUMES} className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${!selectedResumeFile || resumes.length >= MAX_RESUMES ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"}`}><Upload size={18} /> Upload to Vault</button>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-800">Your Vault</h3>
              {resumes.map((resume) => ( <div key={resume.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"><div className="flex items-start justify-between mb-4"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-gray-100 text-gray-600"><FileText size={24} /></div><div><h4 className="font-bold text-gray-800 text-sm truncate max-w-[150px]">{resume.name}</h4><p className="text-xs text-gray-500">Uploaded: {resume.date}</p></div></div><button onClick={() => handleDeleteResume(resume.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button></div><div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">{resume.score !== null ? ( <div className="flex items-center gap-2"><span className="text-sm font-semibold text-gray-600">ATS Score:</span><span className={`text-xl font-bold ${resume.score >= 80 ? "text-green-600" : "text-orange-500"}`}>{resume.score}/100</span></div> ) : <span className="text-xs text-gray-400 font-medium italic">Not analyzed yet</span>}<button onClick={() => handleAnalyzeResume(resume.id)} disabled={resume.isAnalyzing} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${resume.score !== null ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"}`}>{resume.isAnalyzing ? <><Loader2 size={14} className="animate-spin"/> Scanning...</> : <><PlayCircle size={14}/> {resume.score !== null ? "Re-Check" : "Check ATS"}</>}</button></div></div> ))}
            </div>
          </div>
        )}
      </div>
  );
}

// --- SUSPENSE WRAPPER (REQUIRED FOR USE-SEARCH-PARAMS) ---
export default function StudentProfilePage() {
    return (
        <StudentLayout>
            <Suspense fallback={<div className="p-10 text-gray-500">Loading Profile...</div>}>
                <ProfileContent />
            </Suspense>
        </StudentLayout>
    );
}
