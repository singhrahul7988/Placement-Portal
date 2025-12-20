"use client";
import React, { useEffect, useState } from "react";
import StudentLayout from "../../../../components/StudentLayout";
import { ArrowLeft, MapPin, DollarSign, Calendar, CheckCircle, FileText, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function JobDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedResume, setSelectedResume] = useState("");
  const [isApplied, setIsApplied] = useState(false);
  const [job, setJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const { data } = await api.get(`/api/jobs/${params.id}`);
        setJob(data);
      } catch (error: any) {
        setErrorMsg(error.response?.data?.message || "Failed to load job details");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [params.id]);

  const handleApply = () => {
    if (!selectedResume) {
      alert("Please select a resume first!");
      return;
    }
    setIsApplied(true);
    setShowApplyModal(false);
    alert("Application Submitted Successfully!");
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="p-8 text-gray-500">Loading job details...</div>
      </StudentLayout>
    );
  }

  if (!job || errorMsg) {
    return (
      <StudentLayout>
        <div className="p-8 text-red-600">{errorMsg || "Job not found."}</div>
      </StudentLayout>
    );
  }

  const companyName = job.companyId?.name || "Company";
  const rounds = Array.isArray(job.rounds) ? job.rounds : [];

  return (
    <StudentLayout>
      <div className="p-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition-colors">
          <ArrowLeft size={20} /> Back to Feed
        </button>

        <div className="bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 relative"></div>
          
          <div className="px-8 pb-8">
            <div className="relative -top-10 flex items-end justify-between">
              <div className="flex items-end gap-6">
                <div className="w-24 h-24 bg-white rounded-xl shadow-md flex items-center justify-center text-4xl font-bold text-blue-600 border-4 border-white">
                  {companyName[0]}
                </div>
                <div className="mb-2">
                  <h1 className="text-3xl font-bold text-gray-800">{job.title}</h1>
                  <p className="text-gray-500 font-medium flex items-center gap-2">
                    <Briefcase size={16}/> {companyName}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowApplyModal(true)}
                disabled={isApplied}
                className={`px-8 py-3 rounded-lg font-bold shadow-lg transition-all mb-2 ${
                  isApplied ? "bg-green-100 text-green-700 cursor-default" : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isApplied ? "Applied" : "Apply Now"}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 border-y border-gray-100 py-6 mb-6">
              <div className="flex items-center gap-3 text-gray-700 font-medium">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><DollarSign size={20} /></div>
                <div>
                  <p className="text-xs text-gray-400">Salary (CTC)</p>
                  {job.ctc || "N/A"}
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700 font-medium">
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><MapPin size={20} /></div>
                <div>
                  <p className="text-xs text-gray-400">Location</p>
                  {job.location || "N/A"}
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700 font-medium">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Calendar size={20} /></div>
                <div>
                  <p className="text-xs text-gray-400">Deadline</p>
                  {job.deadline ? new Date(job.deadline).toLocaleDateString() : "N/A"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2 space-y-6">
                <section>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">About the Role</h3>
                  <p className="text-gray-600 leading-relaxed">{job.description || "No description provided."}</p>
                </section>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl h-fit">
                <h3 className="font-bold text-gray-800 mb-4">Hiring Process</h3>
                <div className="space-y-6 relative border-l-2 border-gray-200 ml-3 pl-6">
                  {rounds.map((round: string, index: number) => (
                    <div key={index} className="relative">
                      <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm"></div>
                      <h4 className="font-semibold text-gray-800 text-sm">{round}</h4>
                      <p className="text-xs text-gray-500">Round {index + 1}</p>
                    </div>
                  ))}
                  {rounds.length === 0 && (
                    <p className="text-xs text-gray-500">No round details available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 transform transition-all scale-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Complete Application</h2>
            <p className="text-gray-500 mb-6">Select the resume you want to send to {companyName}.</p>

            <div className="space-y-3 mb-6">
              {["Software Engineer Resume.pdf", "Frontend Developer Resume.pdf"].map((resume) => (
                <div 
                  key={resume}
                  onClick={() => setSelectedResume(resume)}
                  className={`p-4 border rounded-xl cursor-pointer flex items-center gap-3 transition-all ${
                    selectedResume === resume ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <FileText className={selectedResume === resume ? "text-blue-600" : "text-gray-400"} />
                  <span className={`font-medium ${selectedResume === resume ? "text-blue-900" : "text-gray-600"}`}>
                    {resume}
                  </span>
                  {selectedResume === resume && <CheckCircle size={18} className="ml-auto text-blue-600" />}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowApplyModal(false)}
                className="flex-1 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleApply}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200"
              >
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
