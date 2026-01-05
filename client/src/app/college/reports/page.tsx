"use client";
import React, { useMemo, useRef, useState } from "react";
import CollegeLayout from "../../../components/CollegeLayout";
import {
  Search,
  Calendar,
  FileText,
  Download,
  RotateCcw
} from "lucide-react";
import TopBarActions from "../../../components/TopBarActions";
import api from "@/lib/api";

const quickReports = [
  {
    title: "Placement Summary",
    description: "Overall stats, placed vs unplaced, offer counts.",
    tag: "Weekly Update",
  },
  {
    title: "Salary Analysis",
    description: "CTC breakdown, avg package, highest offers.",
    tag: "Financial",
  },
  {
    title: "Company Engagement",
    description: "Drive schedules, feedback, selection ratios.",
    tag: "Corporate",
  },
  {
    title: "Unplaced Students",
    description: "List of eligible students without offers.",
    tag: "Action Required",
  },
];

const recentReports = [
  {
    id: "rep-1",
    name: "CSE_Placement_Stats_2024",
    type: "Department Analysis",
    generatedOn: "Oct 24, 2023 10:30 AM",
    format: "PDF",
    status: "Ready",
  },
  {
    id: "rep-2",
    name: "Placement_Summary_Q4",
    type: "Summary",
    generatedOn: "Oct 22, 2023 05:15 PM",
    format: "CSV",
    status: "Ready",
  },
  {
    id: "rep-3",
    name: "Offer_Status_Final_Year",
    type: "Offer Analysis",
    generatedOn: "Oct 20, 2023 11:00 AM",
    format: "PDF",
    status: "Processing",
  }, 
];

export default function CollegeReportsPage() {
  const defaultReportType = "Placement Summary";
  const defaultBatchYear = "Class of 2025 (Current)";
  const defaultDepartment = "All Departments";
  const defaultFields = "CGPA, Offer Status, Company Name";

  const [searchTerm, setSearchTerm] = useState("");
  const [reportType, setReportType] = useState(defaultReportType);
  const [batchYear, setBatchYear] = useState(defaultBatchYear);
  const [department, setDepartment] = useState(defaultDepartment);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fields, setFields] = useState(defaultFields);
  const [format, setFormat] = useState("CSV");
  const [generatedReports, setGeneratedReports] = useState(recentReports);
  const [actionMessage, setActionMessage] = useState("");
  const historyRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on component unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const filteredReports = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return generatedReports;
    return generatedReports.filter((report) =>
      report.name.toLowerCase().includes(term) || report.type.toLowerCase().includes(term)
    );
  }, [generatedReports, searchTerm]);

  const handleGenerate = () => {
    const id = `rep-${Date.now()}`;
    const newReport = {
      id,
      name: `${reportType.replace(/\s+/g, "_")}_${batchYear.replace(/\s+/g, "_")}`,
      type: reportType,
      generatedOn: new Date().toLocaleString(),
      format,
      status: "Processing",
    };
    setGeneratedReports((prev) => [newReport, ...prev]);
    setActionMessage(`Generating ${reportType} report for ${batchYear}.`);
    
    // Clear any existing timeout before setting a new one
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setGeneratedReports((prev) =>
        prev.map((report) =>
          report.id === id ? { ...report, status: "Ready" } : report
        )
      );
      api.post("/api/notifications/report-ready", {
        title: "Report ready",
        detail: `${reportType} report for ${batchYear} is ready.`,
      }).catch(() => null);
      timeoutRef.current = null;
    }, 1200);
  };

  const handleReset = () => {
    setReportType(defaultReportType);
    setBatchYear(defaultBatchYear);
    setDepartment(defaultDepartment);
    setStartDate("");
    setEndDate("");
    setFields(defaultFields);
    setFormat("CSV");
    setActionMessage("");
  };

  const downloadCsv = (rows: string[][], fileName: string) => {
    const csvContent = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadReports = () => {
    const header = ["Report Name", "Type", "Generated On", "Format", "Status"];
    const rows = filteredReports.map((report) => [
      report.name,
      report.type,
      report.generatedOn,
      report.format,
      report.status,
    ]);
    downloadCsv([header, ...rows], "reports_export.csv");
  };

  const handleDownloadReport = (name: string) => {
    downloadCsv([["Report", "Status"], [name, "Ready"]], `${name}.csv`);
  };

  const handleViewHistory = () => {
    historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <CollegeLayout>
      <div className="px-8 py-6">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Reports Center</h1>
            <p className="text-sm text-slate-500">Generate, schedule, and export placement insights.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
              <Search size={16} className="text-slate-400" />
              <input
                placeholder="Search reports..."
                className="outline-none text-sm w-44 text-slate-600"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <TopBarActions settingsPath="/college/settings" />
          </div>
        </header>

        {actionMessage && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {actionMessage}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <div className="text-sm font-semibold text-slate-800">Custom Report Builder</div>
              <p className="text-xs text-slate-500">Configure parameters to generate a specific data set.</p>
            </div>
            <button
              type="button"
              onClick={handleViewHistory}
              className="text-xs text-blue-600 font-semibold"
            >
              View History
            </button>
          </div>
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Report Type</label>
              <select
                className="mt-2 w-full p-3 border border-slate-200 rounded-lg text-sm bg-white"
                value={reportType}
                onChange={(event) => setReportType(event.target.value)}
              >
                <option>Placement Summary</option>
                <option>Offer Analysis</option>
                <option>Company Engagement</option>
                <option>Unplaced Students</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Batch Year</label>
              <select
                className="mt-2 w-full p-3 border border-slate-200 rounded-lg text-sm bg-white"
                value={batchYear}
                onChange={(event) => setBatchYear(event.target.value)}
              >
                <option>Class of 2025 (Current)</option>
                <option>Class of 2024</option>
                <option>Class of 2023</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Department</label>
              <select
                className="mt-2 w-full p-3 border border-slate-200 rounded-lg text-sm bg-white"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
              >
                <option>All Departments</option>
                <option>CSE</option>
                <option>ECE</option>
                <option>IT</option>
                <option>ME</option>
                <option>CE</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Date Range</label>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white w-full">
                  <Calendar size={14} className="text-slate-400" />
                  <input
                    type="date"
                    className="outline-none w-full text-sm text-slate-600"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white w-full">
                  <Calendar size={14} className="text-slate-400" />
                  <input
                    type="date"
                    className="outline-none w-full text-sm text-slate-600"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Include Fields</label>
              <input
                className="mt-2 w-full p-3 border border-slate-200 rounded-lg text-sm"
                value={fields}
                onChange={(event) => setFields(event.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Export Format</label>
              <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="format"
                    checked={format === "PDF"}
                    onChange={() => setFormat("PDF")}
                  />
                  PDF Document
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="format"
                    checked={format === "CSV"}
                    onChange={() => setFormat("CSV")}
                  />
                  CSV / Excel
                </label>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <div>Est. generation time: ~20 seconds</div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleReset} className="text-xs text-slate-400">
                Reset
              </button>
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Quick Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {quickReports.map((report) => (
              <div key={report.title} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <FileText size={18} />
                </div>
                <div className="text-sm font-semibold text-slate-800">{report.title}</div>
                <div className="text-xs text-slate-500 mt-2">{report.description}</div>
                <span className="inline-flex mt-4 text-[11px] uppercase tracking-widest text-slate-400 border border-slate-200 rounded-full px-2 py-1">
                  {report.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div ref={historyRef} className="mt-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div className="text-sm font-semibold text-slate-800">Recent Generated Reports</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center"
                aria-label="Reset filters"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onClick={handleDownloadReports}
                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center"
                aria-label="Download reports"
              >
                <Download size={14} />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="p-4">Report Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Generated On</th>
                  <th className="p-4">Format</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{report.name}</div>
                      <div className="text-xs text-slate-400">Size: 2.4 MB</div>
                    </td>
                    <td className="p-4 text-slate-500">{report.type}</td>
                    <td className="p-4 text-slate-500">{report.generatedOn}</td>
                    <td className="p-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">{report.format}</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          report.status === "Ready"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownloadReport(report.name)}
                        className="text-blue-600 text-sm font-semibold"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredReports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-sm text-slate-400">
                      No reports match this search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </CollegeLayout>
  );
}
