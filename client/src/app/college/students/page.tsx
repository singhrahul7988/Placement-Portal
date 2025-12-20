"use client";
import React, { useState, useEffect } from "react";
// 1. IMPORT THE NEW LAYOUT (Instead of Sidebar)
import CollegeLayout from "../../../components/CollegeLayout"; 
import { UserPlus, Upload, FileText, CheckCircle, AlertCircle, Download, Trash2, Search } from "lucide-react";
import api from "@/lib/api";
import * as XLSX from "xlsx";

export default function StudentDirectory() {
  const [activeMethod, setActiveMethod] = useState("manual");
  const [formData, setFormData] = useState({ name: "", email: "", branch: "", cgpa: "", phone: "" });
  
  // BULK STATE
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // DATA STATE
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. FETCH STUDENTS
  const fetchStudents = async () => {
    try {
        const storedUser = localStorage.getItem("user");
        if(!storedUser) return;
        const user = JSON.parse(storedUser);
        const collegeId = user.role === "college" ? user._id : user.collegeId;

        const { data } = await api.get(`/api/auth/students/${collegeId}`);
        setStudents(data);
        setLoading(false);
    } catch (error) {
        console.error("Failed to load students");
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // 2. DELETE
  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure you want to remove this student?")) return;
    try {
        await api.delete(`/api/auth/student/${id}`);
        fetchStudents();
    } catch (error) {
        alert("Delete failed");
    }
  };

  // 3. MANUAL ADD
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const storedUser = localStorage.getItem("user");
        if(!storedUser) return;
        const user = JSON.parse(storedUser);
        const collegeId = user.role === "college" ? user._id : user.collegeId;

        await api.post("/api/auth/add-student", { ...formData, collegeId });
        alert(`Student added!`);
        setFormData({ name: "", email: "", branch: "", cgpa: "", phone: "" });
        fetchStudents();
    } catch (error: any) {
        alert("Error: " + error.response?.data?.message);
    }
  };

  // 4. BULK UPLOAD
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.files && e.target.files[0]) setBulkFile(e.target.files[0]);
  };

  const processBulkUpload = async () => {
    if(!bulkFile) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        if(jsonData.length === 0) { alert("File empty!"); setIsUploading(false); return; }

        try {
            const storedUser = localStorage.getItem("user");
            if(!storedUser) return;
            const user = JSON.parse(storedUser);
            const collegeId = user.role === "college" ? user._id : user.collegeId;

            const res = await api.post("/api/auth/add-students-bulk", { students: jsonData, collegeId });
            alert(res.data.message);
            setBulkFile(null);
            fetchStudents();
        } catch (error: any) { alert("Upload Failed: " + error.message); } 
        finally { setIsUploading(false); }
    };
    reader.readAsBinaryString(bulkFile);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ name: "John Doe", email: "john@test.com", branch: "CSE", cgpa: 8.5, phone: "9876543210" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "student_template.xlsx");
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- THE NEW LAYOUT WRAPPER ---
  return (
    <CollegeLayout>
      {/* Note: We removed <div flex>, <CollegeSidebar>, and <main ml-64> */}
      {/* We just wrap the content in a simple padding div */}
      
      <div className="p-8"> 
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Student Directory</h1>

        {/* ONBOARDING SECTION */}
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm mb-10">
            <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                <UserPlus className="text-indigo-600"/> Onboard New Students
            </h3>

            <div className="flex gap-4 mb-6">
                <button onClick={() => setActiveMethod("manual")} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeMethod === "manual" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}>Manual Entry</button>
                <button onClick={() => setActiveMethod("bulk")} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeMethod === "bulk" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}>Bulk Upload</button>
            </div>

            {activeMethod === "manual" ? (
                <form onSubmit={handleAddStudent} className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <input required placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="p-3 border rounded-lg"/>
                        <input required placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="p-3 border rounded-lg"/>
                        <input required placeholder="Branch" value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} className="p-3 border rounded-lg"/>
                        <input required placeholder="CGPA" value={formData.cgpa} onChange={e => setFormData({...formData, cgpa: e.target.value})} className="p-3 border rounded-lg"/>
                        <input required placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="p-3 border rounded-lg"/>
                    </div>
                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold">Add Student</button>
                </form>
            ) : (
                <div className="flex items-center gap-4">
                    <button onClick={downloadTemplate} className="text-sm text-blue-600 underline">Download Template</button>
                    <input type="file" onChange={handleFileChange} accept=".xlsx, .csv" />
                    <button onClick={processBulkUpload} disabled={!bulkFile || isUploading} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold">{isUploading ? "Uploading..." : "Process File"}</button>
                </div>
            )}
        </div>

        {/* STUDENT LIST TABLE */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">Enrolled Students ({students.length})</h3>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                        placeholder="Search by name or email..." 
                        className="pl-10 p-2 border rounded-lg w-64 outline-none focus:ring-2 focus:ring-indigo-500"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 font-semibold text-sm">
                    <tr>
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Branch</th>
                        <th className="p-4">CGPA</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                    {loading ? (
                        <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading directory...</td></tr>
                    ) : filteredStudents.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-gray-500">No students found.</td></tr>
                    ) : (
                        filteredStudents.map((student) => (
                            <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-medium text-gray-800">{student.name}</td>
                                <td className="p-4 text-gray-500">{student.email}</td>
                                <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{student.branch}</span></td>
                                <td className="p-4 font-bold">{student.cgpa}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${student.isFirstLogin ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                        {student.isFirstLogin ? 'Pending Activation' : 'Active'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button onClick={() => handleDelete(student._id)} className="text-gray-400 hover:text-red-600 transition-colors">
                                        <Trash2 size={18}/>
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </CollegeLayout>
  );
}
